import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import mqtt, { MqttClient } from "mqtt";
import { PrismaService } from "../prisma/prisma.service";
import { SensorReadingService } from "../sensor/sensor-reading.service";

interface ParsedTopic {
  accountId: number | null;
  deviceId: string;
  sensorId: number;
}

interface SensorPayload {
  value: number;
  ts?: string;
  status?: string;
  unit?: string;
  extra?: unknown;
}

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: MqttClient | null = null;
  private dataTopicPattern = "sv/+/+/sensors/+";
  private discoveryTopicPattern = "sv/+/+/config";

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly sensorReadingService: SensorReadingService,
  ) {}

  onModuleDestroy() {
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
  }

  onModuleInit() {
    const host = this.config.get<string>("MQTT_HOST");
    const port = this.config.get<string>("MQTT_PORT");
    const username = this.config.get<string>("MQTT_USERNAME");
    const password = this.config.get<string>("MQTT_PASSWORD");
    this.dataTopicPattern = this.config.get<string>(
      "MQTT_TOPIC_PATTERN",
      this.dataTopicPattern,
    );
    this.discoveryTopicPattern = this.config.get<string>(
      "MQTT_DISCOVERY_PATTERN",
      this.discoveryTopicPattern,
    );

    if (!host) {
      this.logger.warn("MQTT_HOST not set - MQTT ingestion disabled");
      return;
    }

    const url = `mqtt://${host}:${port}`;
    this.logger.log(`Connecting to MQTT broker at ${url}`);

    this.client = mqtt.connect(url, {
      username,
      password,
      reconnectPeriod: 5000,
    });

    this.client.on("connect", () => {
      this.logger.log(
        `MQTT connected to ${host}:${port}, subscribing to ${this.dataTopicPattern} & ${this.discoveryTopicPattern}`,
      );
      this.client?.subscribe(
        [this.dataTopicPattern, this.discoveryTopicPattern],
        (err) => {
          if (err) {
            this.logger.error(
              `Failed to subscribe to MQTT topics`,
              err,
            );
          }
        },
      );
    });

    this.client.on("message", (topic, payload) => {
      this.handleMessage(topic, payload.toString()).catch((err) => {
        this.logger.error(`Failed to handle MQTT message on ${topic}`, err);
      });
    });

    this.client.on("error", (err) => {
      this.logger.error("MQTT connection error", err);
    });
  }

  private parseTopic(topic: string): ParsedTopic | null {
    const parts = topic.split("/");
    if (parts.length < 5) {
      return null;
    }

    const [root, accountStr, deviceId, sensorsKeyword, sensorIdStr] = parts;
    if (root !== "sv" || sensorsKeyword !== "sensors") {
      return null;
    }

    const sensorId = Number(sensorIdStr);
    if (!Number.isFinite(sensorId)) {
      return null;
    }

    const accountId = Number(accountStr);
    return {
      accountId: Number.isFinite(accountId) ? accountId : null,
      deviceId,
      sensorId,
    };
  }

  private parseDiscoveryTopic(topic: string): { accountId: number | null; deviceId: string } | null {
    const parts = topic.split("/");
    if (parts.length < 4) {
      return null;
    }
    const [root, accountStr, deviceId, configKeyword] = parts;
    if (root !== "sv" || configKeyword !== "config") {
      return null;
    }
    const accountId = Number(accountStr);
    return {
      accountId: Number.isFinite(accountId) ? accountId : null,
      deviceId,
    };
  }

  private parsePayload(payload: string): SensorPayload | null {
    try {
      const data = JSON.parse(payload);
      if (typeof data.value !== "number") {
        return null;
      }
      return {
        value: data.value,
        ts: data.ts ?? data.timestamp ?? undefined,
        status: data.status,
        unit: data.unit,
        extra: data.extra,
      };
    } catch (err) {
      this.logger.warn("Failed to parse MQTT payload as JSON");
      return null;
    }
  }

  private parseDiscoveryPayload(payload: string): {
    villageId: number;
    device?: { name?: string; latitude?: number; longitude?: number };
    sensors?: Array<{
      sensorId?: number;
      sensorTypeId: number;
      name: string;
      infoText?: string;
      latitude?: number;
      longitude?: number;
    }>;
  } | null {
    try {
      const data = JSON.parse(payload);
      if (!data || typeof data.villageId !== "number") {
        return null;
      }
      if (data.sensors && !Array.isArray(data.sensors)) {
        return null;
      }
      return data;
    } catch (err) {
      this.logger.warn("Failed to parse MQTT discovery payload as JSON");
      return null;
    }
  }

  private async handleMessage(topic: string, payload: string) {
    if (topic.endsWith("/config")) {
      await this.handleDiscovery(topic, payload);
      return;
    }

    const parsedTopic = this.parseTopic(topic);
    if (!parsedTopic) {
      this.logger.warn(`Ignoring MQTT message with unexpected topic: ${topic}`);
      return;
    }

    const { accountId, deviceId, sensorId } = parsedTopic;
    const data = this.parsePayload(payload);
    if (!data) {
      this.logger.warn(`Ignoring MQTT message with invalid payload for ${topic}`);
      return;
    }

    const device = await this.prisma.device.findUnique({
      where: { deviceId },
      include: { village: true },
    });

    if (!device) {
      this.logger.warn(`MQTT: Device ${deviceId} not found`);
      return;
    }

    if (accountId !== null && device.village && device.village.accountId !== accountId) {
      this.logger.warn(
        `MQTT: Device ${deviceId} belongs to account ${device.village.accountId}, topic had ${accountId}`,
      );
      return;
    }

    const sensor = await this.prisma.sensor.findUnique({
      where: { id: sensorId },
      select: { id: true, deviceId: true, villageId: true },
    });

    if (!sensor) {
      this.logger.warn(`MQTT: Sensor ${sensorId} not found`);
      return;
    }

    if (sensor.deviceId && sensor.deviceId !== device.id) {
      this.logger.warn(
        `MQTT: Sensor ${sensorId} not linked to device ${deviceId} (expected ${sensor.deviceId})`,
      );
      return;
    }

    const timestamp = data.ts || new Date().toISOString();
    const timestampSource = data.ts ? "payload" : "server";

    await this.sensorReadingService.createReadings(sensor.id, [
      {
        ts: timestamp,
        value: data.value,
        status: data.status,
        extra: {
          unit: data.unit,
          source: "mqtt",
          timestampSource,
          raw: data.extra,
        },
      },
    ]);

    this.logger.debug(
      `MQTT: Stored reading for sensor ${sensorId} (device ${deviceId}) value=${data.value}`,
    );
  }

  private async handleDiscovery(topic: string, payload: string) {
    const parsedTopic = this.parseDiscoveryTopic(topic);
    if (!parsedTopic) {
      this.logger.warn(`Ignoring MQTT discovery with unexpected topic: ${topic}`);
      return;
    }

    const data = this.parseDiscoveryPayload(payload);
    if (!data) {
      this.logger.warn(`Ignoring MQTT discovery with invalid payload for ${topic}`);
      return;
    }

    const { accountId, deviceId } = parsedTopic;
    const { villageId, device, sensors } = data;

    const village = await this.prisma.village.findUnique({
      where: { id: villageId },
      select: { id: true, accountId: true },
    });

    if (!village) {
      this.logger.warn(`MQTT discovery: Village ${villageId} not found`);
      return;
    }

    if (accountId !== null && village.accountId !== accountId) {
      this.logger.warn(
        `MQTT discovery: Village ${villageId} belongs to account ${village.accountId}, topic had ${accountId}`,
      );
      return;
    }

    let deviceRecord = await this.prisma.device.findUnique({
      where: { deviceId },
    });

    if (deviceRecord && deviceRecord.villageId !== village.id) {
      this.logger.warn(
        `MQTT discovery: Device ${deviceId} belongs to village ${deviceRecord.villageId}, payload had ${village.id}`,
      );
      return;
    }

    if (!deviceRecord) {
      deviceRecord = await this.prisma.device.create({
        data: {
          deviceId,
          villageId: village.id,
          name: device?.name ?? null,
          latitude: device?.latitude ?? null,
          longitude: device?.longitude ?? null,
        },
      });
      this.logger.log(
        `MQTT discovery: Created device ${deviceId} in village ${village.id}`,
      );
    } else if (
      (device && (device.name !== undefined || device.latitude !== undefined || device.longitude !== undefined))
    ) {
      const updateData: {
        name?: string | null;
        latitude?: number | null;
        longitude?: number | null;
      } = {};
      if (device.name !== undefined) {
        updateData.name = device.name;
      }
      if (device.latitude !== undefined) {
        updateData.latitude = device.latitude;
      }
      if (device.longitude !== undefined) {
        updateData.longitude = device.longitude;
      }
      if (Object.keys(updateData).length > 0) {
        deviceRecord = await this.prisma.device.update({
          where: { id: deviceRecord.id },
          data: updateData,
        });
      }
    }

    if (Array.isArray(sensors)) {
      const deviceInternalId = deviceRecord.id;

      for (const sensor of sensors) {
        if (typeof sensor.sensorTypeId !== "number" || typeof sensor.name !== "string") {
          this.logger.warn(
            `MQTT discovery: Skipping sensor with invalid fields on device ${deviceId}`,
          );
          continue;
        }
        const sensorId = sensor.sensorId ?? null;
        const baseData = {
          villageId: village.id,
          sensorTypeId: sensor.sensorTypeId,
          name: sensor.name,
          infoText: sensor.infoText ?? null,
          deviceId: deviceInternalId,
          latitude: sensor.latitude ?? null,
          longitude: sensor.longitude ?? null,
        };

        if (sensorId !== null && Number.isFinite(sensorId)) {
          await this.prisma.sensor.upsert({
            where: { id: sensorId as number },
            create: { id: sensorId as number, ...baseData },
            update: baseData,
          });
        } else {
          const existing = await this.prisma.sensor.findFirst({
            where: { villageId: village.id, deviceId: deviceInternalId, name: sensor.name },
          });
          if (existing) {
            await this.prisma.sensor.update({
              where: { id: existing.id },
              data: baseData,
            });
          } else {
            await this.prisma.sensor.create({ data: baseData });
          }
        }
      }
    }
  }
}

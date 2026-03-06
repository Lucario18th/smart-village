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
    const topicPattern = this.config.get<string>(
      "MQTT_TOPIC_PATTERN",
      "sv/+/+/sensors/+",
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
        `MQTT connected to ${host}:${port}, subscribing to ${topicPattern}`,
      );
      this.client?.subscribe(topicPattern, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to ${topicPattern}`, err);
        }
      });
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

  private async handleMessage(topic: string, payload: string) {
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
}

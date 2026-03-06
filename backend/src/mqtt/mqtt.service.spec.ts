import { EventEmitter } from 'events';
import { MqttService } from './mqtt.service';
import { PrismaService } from '../prisma/prisma.service';
import { SensorReadingService } from '../sensor/sensor-reading.service';

const mockConnect = jest.fn();

jest.mock('mqtt', () => ({
  connect: (...args: any[]) => mockConnect(...args),
}));

describe('MqttService', () => {
  let service: MqttService;
  let prisma: any;
  let sensorReadingService: any;
  let config: { get: jest.Mock };
  let fakeClient: EventEmitter & { subscribe: jest.Mock; end: jest.Mock };

  const buildPayload = (value: number) =>
    Buffer.from(JSON.stringify({ value, ts: '2024-01-01T00:00:00Z', unit: '°C' }));

  beforeEach(() => {
    fakeClient = new EventEmitter() as any;
    fakeClient.subscribe = jest.fn((_topic, cb) => cb && cb(null));
    fakeClient.end = jest.fn();
    mockConnect.mockReturnValue(fakeClient as any);

    prisma = {
      device: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      sensor: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      village: { findUnique: jest.fn() },
    } as any;

    sensorReadingService = {
      createReadings: jest.fn(),
    } as any;

    config = {
      get: jest.fn((key: string, fallback?: any) => {
        const map: Record<string, any> = {
          MQTT_HOST: "localhost",
          MQTT_PORT: "1883",
          MQTT_TOPIC_PATTERN: "sv/+/+/sensors/+",
          MQTT_DISCOVERY_PATTERN: "sv/+/+/config",
          MQTT_USERNAME: "",
          MQTT_PASSWORD: "",
        };
        return map[key] ?? fallback;
      }),
    };

    service = new MqttService(config as any, prisma, sensorReadingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('subscribes and stores readings for known sensor/device', async () => {
    prisma.device.findUnique.mockResolvedValue({
      id: 10,
      deviceId: 'ctrl-1',
      village: { accountId: 2 },
    });
    prisma.sensor.findUnique.mockResolvedValue({
      id: 20,
      deviceId: 10,
      villageId: 5,
    });
    sensorReadingService.createReadings.mockResolvedValue({ created: 1 });

    service.onModuleInit();
    fakeClient.emit('connect');

    fakeClient.emit('message', 'sv/2/ctrl-1/sensors/20', buildPayload(12.3));

    await new Promise(process.nextTick);

    expect(fakeClient.subscribe).toHaveBeenCalled();
    expect(sensorReadingService.createReadings).toHaveBeenCalledWith(20, [
      expect.objectContaining({
        value: 12.3,
        ts: '2024-01-01T00:00:00Z',
        extra: expect.objectContaining({ unit: '°C' }),
      }),
    ]);
  });

  it('ignores messages for unknown device', async () => {
    prisma.device.findUnique.mockResolvedValue(null);

    service.onModuleInit();
    fakeClient.emit('connect');
    fakeClient.emit('message', 'sv/2/unknown/sensors/20', buildPayload(1.0));
    await new Promise(process.nextTick);

    expect(sensorReadingService.createReadings).not.toHaveBeenCalled();
  });

  it('creates device and sensors from discovery config', async () => {
    prisma.village.findUnique.mockResolvedValue({ id: 1, accountId: 2 });
    prisma.device.findUnique.mockResolvedValue(null);
    prisma.device.create.mockResolvedValue({ id: 10, deviceId: 'ctrl-1', villageId: 1 });
    prisma.sensor.upsert.mockResolvedValue({});
    prisma.sensor.findFirst.mockResolvedValue(null);
    prisma.sensor.findMany.mockResolvedValue([]);
    prisma.sensor.create.mockResolvedValue({});

    const discoveryPayload = {
      villageId: 1,
      device: { name: 'Controller', latitude: 50.1, longitude: 8.6 },
      sensors: [
        { sensorId: 20, sensorTypeId: 1, name: 'Temp', infoText: 'Indoor' },
        { sensorTypeId: 2, name: 'Humidity' },
      ],
    };

    service.onModuleInit();
    fakeClient.emit('connect');

    fakeClient.emit(
      'message',
      'sv/2/ctrl-1/config',
      Buffer.from(JSON.stringify(discoveryPayload)),
    );

    await new Promise(process.nextTick);

    expect(fakeClient.subscribe).toHaveBeenCalled();
    expect(prisma.device.create).toHaveBeenCalledWith({
      data: {
        deviceId: 'ctrl-1',
        villageId: 1,
        name: 'Controller',
        latitude: 50.1,
        longitude: 8.6,
      },
    });
    expect(prisma.sensor.upsert).toHaveBeenCalledWith({
      where: { id: 20 },
      create: expect.objectContaining({
        id: 20,
        villageId: 1,
        sensorTypeId: 1,
        name: 'Temp',
        deviceId: 10,
      }),
      update: expect.objectContaining({
        villageId: 1,
        sensorTypeId: 1,
        name: 'Temp',
        deviceId: 10,
      }),
    });
    expect(prisma.sensor.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        villageId: 1,
        sensorTypeId: 2,
        name: 'Humidity',
        deviceId: 10,
      }),
    });
  });
});

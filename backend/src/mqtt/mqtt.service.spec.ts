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
  let fakeClient: EventEmitter & { subscribe: jest.Mock; end: jest.Mock };

  const buildPayload = (value: number) =>
    Buffer.from(JSON.stringify({ value, ts: '2024-01-01T00:00:00Z', unit: '°C' }));

  beforeEach(() => {
    fakeClient = new EventEmitter() as any;
    fakeClient.subscribe = jest.fn((topic, cb) => cb && cb(null));
    fakeClient.end = jest.fn();
    mockConnect.mockReturnValue(fakeClient as any);

    prisma = {
      device: { findUnique: jest.fn() },
      sensor: { findUnique: jest.fn() },
    } as any;

    sensorReadingService = {
      createReadings: jest.fn(),
    } as any;

    service = new MqttService(prisma, sensorReadingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('subscribes and stores readings for known sensor/device', async () => {
    process.env.MQTT_HOST = 'localhost';

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
    process.env.MQTT_HOST = 'localhost';

    prisma.device.findUnique.mockResolvedValue(null);

    service.onModuleInit();
    fakeClient.emit('connect');
    fakeClient.emit('message', 'sv/2/unknown/sensors/20', buildPayload(1.0));
    await new Promise(process.nextTick);

    expect(sensorReadingService.createReadings).not.toHaveBeenCalled();
  });
});

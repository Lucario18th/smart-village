namespace SmartVillageWPF.Services;

/// <summary>
/// Default configuration pointing to the Smart Village infrastructure.
/// Values match the existing MQTT broker and backend server setup
/// as documented in doku-Neu/backend/mqtt-integration.md.
/// </summary>
public class ConfigService : IConfigService
{
    // MQTT broker at the project server
    public string MqttHost { get; } = "192.168.23.113";
    public int MqttPort { get; } = 1883;
    public string? MqttUsername { get; } = null;
    public string? MqttPassword { get; } = null;

    // Topic patterns matching the backend MQTT service configuration
    // Data topic: sv/{accountId}/{deviceId}/sensors/{sensorId}
    public string SensorTopicPattern { get; } = "sv/+/+/sensors/+";

    // Discovery topic: sv/{accountId}/{deviceId}/config
    public string DiscoveryTopicPattern { get; } = "sv/+/+/config";

    // App-forwarded sensor topic: app/village/{villageId}/sensors
    public string AppSensorTopicPattern { get; } = "app/village/+/sensors";

    // Backend REST API base URL
    public string ServerBaseUrl { get; } = "http://192.168.23.113:3000";
}

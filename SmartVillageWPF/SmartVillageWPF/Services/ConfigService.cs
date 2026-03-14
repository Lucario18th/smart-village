namespace SmartVillageWPF.Services;

/// <summary>
/// Default configuration pointing to the Smart Village infrastructure.
/// By default all HTTP and MQTT connections use localhost.
/// Set UseCustomHost = true and CustomHost to an IP (e.g. 192.168.23.113)
/// to reach a remote server instead.
/// </summary>
public class ConfigService : IConfigService
{
    // ── Host configuration ──────────────────────────────────────────
    // Flip to true and set CustomHost to switch from localhost to a remote IP.
    public bool UseCustomHost { get; } = false;
    public string CustomHost { get; } = "192.168.23.113";

    private string Host => UseCustomHost ? CustomHost : "localhost";

    // ── MQTT ────────────────────────────────────────────────────────
    public string MqttHost => Host;
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

    // ── HTTP ────────────────────────────────────────────────────────
    // App-API base URL (backend HTTP port 8000)
    public string AppApiBaseUrl => $"http://{Host}:8000";

    // Backend REST API base URL (same server)
    public string ServerBaseUrl => $"http://{Host}:8000";
}

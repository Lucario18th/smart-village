namespace SmartVillageWPF.Services;

/// <summary>
/// Provides application configuration values (MQTT broker, server address, etc.).
/// </summary>
public interface IConfigService
{
    string MqttHost { get; }
    int MqttPort { get; }
    string? MqttUsername { get; }
    string? MqttPassword { get; }
    string SensorTopicPattern { get; }
    string DiscoveryTopicPattern { get; }
    string AppSensorTopicPattern { get; }
    string ServerBaseUrl { get; }
}

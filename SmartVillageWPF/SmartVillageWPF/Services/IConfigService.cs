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

    /// <summary>
    /// Base URL for the App-API (backend HTTP).
    /// Configurable via UseCustomHost/CustomHost; defaults to http://localhost:8000.
    /// </summary>
    string AppApiBaseUrl { get; }

    /// <summary>
    /// When true, MqttHost and AppApiBaseUrl use the CustomHost IP
    /// instead of localhost.
    /// </summary>
    bool UseCustomHost { get; }

    /// <summary>
    /// Custom host IP address used when UseCustomHost is true.
    /// Example: 192.168.23.113
    /// </summary>
    string CustomHost { get; }

    string ServerBaseUrl { get; }
}

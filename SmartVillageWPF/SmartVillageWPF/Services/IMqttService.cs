using SmartVillageWPF.Models;

namespace SmartVillageWPF.Services;

/// <summary>
/// Defines the MQTT service contract for connecting to the Smart Village MQTT broker
/// and receiving sensor data and discovery messages.
/// </summary>
public interface IMqttService
{
    /// <summary>
    /// Current connection status.
    /// </summary>
    ConnectionStatus Status { get; }

    /// <summary>
    /// Fired when the connection status changes.
    /// </summary>
    event EventHandler<ConnectionStatus>? StatusChanged;

    /// <summary>
    /// Fired when a new sensor reading is received on a sensor data topic.
    /// Topic format: sv/{accountId}/{deviceId}/sensors/{sensorId}
    /// </summary>
    event EventHandler<SensorReading>? SensorDataReceived;

    /// <summary>
    /// Fired when a discovery message is received on a config topic.
    /// Topic format: sv/{accountId}/{deviceId}/config
    /// </summary>
    event EventHandler<DiscoveryPayload>? DiscoveryReceived;

    /// <summary>
    /// Fired when an app-forwarded sensor reading is received.
    /// Topic format: app/village/{villageId}/sensors
    /// </summary>
    event EventHandler<SensorReading>? AppSensorDataReceived;

    /// <summary>
    /// Connect to the MQTT broker asynchronously.
    /// </summary>
    Task ConnectAsync();

    /// <summary>
    /// Disconnect from the MQTT broker asynchronously.
    /// </summary>
    Task DisconnectAsync();

    /// <summary>
    /// Subscribe to the app sensor topic for a specific village.
    /// Unsubscribes from any previously selected village topic.
    /// </summary>
    Task SubscribeToVillageAsync(int villageId);
}

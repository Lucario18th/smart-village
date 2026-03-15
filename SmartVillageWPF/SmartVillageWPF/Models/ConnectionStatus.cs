namespace SmartVillageWPF.Models;

/// <summary>
/// Represents the current MQTT connection status.
/// </summary>
public enum ConnectionStatus
{
    Disconnected,
    Connecting,
    Connected,
    Reconnecting,
    Error
}

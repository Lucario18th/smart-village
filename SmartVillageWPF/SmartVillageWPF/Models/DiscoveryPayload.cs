namespace SmartVillageWPF.Models;

/// <summary>
/// Represents a discovery message received on the MQTT discovery topic.
/// Topic format: sv/{accountId}/{deviceId}/config
/// Payload as documented in doku-Neu/backend/mqtt-integration.md.
/// </summary>
public class DiscoveryPayload
{
    public int VillageId { get; set; }
    public DiscoveryDevice? Device { get; set; }
    public List<DiscoverySensor> Sensors { get; set; } = new();
}

public class DiscoveryDevice
{
    public string? Name { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class DiscoverySensor
{
    public int? SensorId { get; set; }
    public int SensorTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? InfoText { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

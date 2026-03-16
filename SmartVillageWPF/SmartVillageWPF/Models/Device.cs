namespace SmartVillageWPF.Models;

/// <summary>
/// Represents an IoT device/gateway as defined in the backend database.
/// Matches the Device model from prisma/schema.prisma.
/// </summary>
public class Device
{
    public int Id { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public int VillageId { get; set; }
    public string? Name { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

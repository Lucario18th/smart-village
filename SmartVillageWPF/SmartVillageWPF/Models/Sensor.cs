namespace SmartVillageWPF.Models;

/// <summary>
/// Represents a sensor as defined in the backend database.
/// Matches the Sensor model from prisma/schema.prisma.
/// </summary>
public class Sensor
{
    public int Id { get; set; }
    public int VillageId { get; set; }
    public int? DeviceId { get; set; }
    public int SensorTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? InfoText { get; set; }
    public bool IsActive { get; set; } = true;
    public bool ReceiveData { get; set; } = true;
    public bool ExposeToApp { get; set; } = true;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string Origin { get; set; } = "HARDWARE";
}

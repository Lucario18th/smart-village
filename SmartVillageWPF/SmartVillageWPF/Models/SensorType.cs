namespace SmartVillageWPF.Models;

/// <summary>
/// Represents a sensor type as defined in the backend database.
/// Matches the SensorType model from prisma/schema.prisma.
/// </summary>
public class SensorType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string? Description { get; set; }
}

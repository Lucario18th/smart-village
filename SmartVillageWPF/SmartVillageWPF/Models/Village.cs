namespace SmartVillageWPF.Models;

/// <summary>
/// Represents a village/municipality as defined in the backend database.
/// Matches the Village model from prisma/schema.prisma.
/// </summary>
public class Village
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? InfoText { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
}

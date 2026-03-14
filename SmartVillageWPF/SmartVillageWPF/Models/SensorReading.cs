using System.Text.Json;

namespace SmartVillageWPF.Models;

/// <summary>
/// Represents a sensor reading received via MQTT.
/// Matches the payload format: { value, ts, status, unit, extra }
/// as documented in doku-Neu/backend/mqtt-integration.md.
/// </summary>
public class SensorReading
{
    public int SensorId { get; set; }
    public double Value { get; set; }
    public DateTime Timestamp { get; set; }
    public string Status { get; set; } = "OK";
    public string? Unit { get; set; }
    public JsonElement? Extra { get; set; }
}

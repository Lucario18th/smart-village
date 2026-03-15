using System.Text.Json.Serialization;

namespace SmartVillageWPF.Models;

/// <summary>
/// Represents the JSON payload received on the sensor data MQTT topic.
/// Topic format: sv/{accountId}/{deviceId}/sensors/{sensorId}
/// As documented in doku-Neu/backend/mqtt-integration.md.
/// </summary>
public class SensorPayload
{
    [JsonPropertyName("value")]
    public double Value { get; set; }

    [JsonPropertyName("ts")]
    public string? Timestamp { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("unit")]
    public string? Unit { get; set; }

    [JsonPropertyName("extra")]
    public Dictionary<string, object>? Extra { get; set; }
}

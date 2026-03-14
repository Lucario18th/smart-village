using System.Text.Json.Serialization;

namespace SmartVillageWPF.Models;

/// <summary>
/// Generic API response wrapper matching the backend's ApiResponse&lt;T&gt; shape.
/// All App-API endpoints return { success, data, timestamp }.
/// </summary>
public class ApiResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("data")]
    public T? Data { get; set; }

    [JsonPropertyName("timestamp")]
    public string? Timestamp { get; set; }
}

/// <summary>
/// A village entry as returned by GET /app/villages.
/// </summary>
public class VillageListItem
{
    [JsonPropertyName("villageId")]
    public int VillageId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("locationName")]
    public string LocationName { get; set; } = string.Empty;

    [JsonPropertyName("postalCode")]
    public PostalCodeInfo? PostalCode { get; set; }

    [JsonPropertyName("sensorCount")]
    public int SensorCount { get; set; }

    [JsonPropertyName("features")]
    public VillageFeatures? Features { get; set; }
}

/// <summary>
/// Postal code info nested in village responses.
/// </summary>
public class PostalCodeInfo
{
    [JsonPropertyName("zipCode")]
    public string ZipCode { get; set; } = string.Empty;

    [JsonPropertyName("city")]
    public string City { get; set; } = string.Empty;
}

/// <summary>
/// Feature flags controlling which modules are enabled for a village.
/// Matches the features object returned by the App-API.
/// </summary>
public class VillageFeatures
{
    [JsonPropertyName("sensorData")]
    public bool SensorData { get; set; } = true;

    [JsonPropertyName("weather")]
    public bool Weather { get; set; } = true;

    [JsonPropertyName("messages")]
    public bool Messages { get; set; } = true;

    [JsonPropertyName("events")]
    public bool Events { get; set; }

    [JsonPropertyName("map")]
    public bool Map { get; set; } = true;

    [JsonPropertyName("rideShare")]
    public bool RideShare { get; set; } = true;

    [JsonPropertyName("textileContainers")]
    public bool TextileContainers { get; set; }
}

/// <summary>
/// Controls which sensor detail fields are visible in the app.
/// Returned by GET /app/villages/:id/config → sensorDetailVisibility.
/// </summary>
public class SensorDetailVisibility
{
    [JsonPropertyName("name")]
    public bool Name { get; set; } = true;

    [JsonPropertyName("type")]
    public bool Type { get; set; } = true;

    [JsonPropertyName("description")]
    public bool Description { get; set; } = true;

    [JsonPropertyName("coordinates")]
    public bool Coordinates { get; set; } = true;
}

/// <summary>
/// Village configuration as returned by GET /app/villages/:id/config.
/// </summary>
public class VillageConfig
{
    [JsonPropertyName("villageId")]
    public int VillageId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("locationName")]
    public string LocationName { get; set; } = string.Empty;

    [JsonPropertyName("postalCode")]
    public PostalCodeInfo? PostalCode { get; set; }

    [JsonPropertyName("features")]
    public VillageFeatures? Features { get; set; }

    [JsonPropertyName("sensorDetailVisibility")]
    public SensorDetailVisibility? SensorDetailVisibility { get; set; }

    [JsonPropertyName("sensors")]
    public List<VillageConfigSensor> Sensors { get; set; } = new();
}

/// <summary>
/// A sensor entry within the village config response.
/// </summary>
public class VillageConfigSensor
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;

    [JsonPropertyName("latitude")]
    public double? Latitude { get; set; }

    [JsonPropertyName("longitude")]
    public double? Longitude { get; set; }
}

/// <summary>
/// Initial data response from GET /app/villages/:id/initial-data.
/// Only populated sections are present (controlled by feature flags server-side).
/// </summary>
public class InitialData
{
    [JsonPropertyName("villageId")]
    public int VillageId { get; set; }

    [JsonPropertyName("sensors")]
    public List<InitialDataSensor>? Sensors { get; set; }

    [JsonPropertyName("messages")]
    public List<InitialDataMessage>? Messages { get; set; }

    [JsonPropertyName("rideshares")]
    public List<InitialDataRideShare>? Rideshares { get; set; }
}

/// <summary>
/// A sensor with its last reading, from initial-data.
/// </summary>
public class InitialDataSensor
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;

    [JsonPropertyName("latitude")]
    public double? Latitude { get; set; }

    [JsonPropertyName("longitude")]
    public double? Longitude { get; set; }

    [JsonPropertyName("lastReading")]
    public LastReading? LastReading { get; set; }
}

/// <summary>
/// Last reading attached to a sensor in the initial-data response.
/// </summary>
public class LastReading
{
    [JsonPropertyName("value")]
    public double Value { get; set; }

    [JsonPropertyName("ts")]
    public DateTime Ts { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "OK";
}

/// <summary>
/// A message from initial-data (when enableMessages is active).
/// </summary>
public class InitialDataMessage
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("priority")]
    public string Priority { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = string.Empty;
}

/// <summary>
/// A rideshare bench from initial-data (when enableRideShare is active).
/// </summary>
public class InitialDataRideShare
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("personCount")]
    public int PersonCount { get; set; }

    [JsonPropertyName("maxCapacity")]
    public int? MaxCapacity { get; set; }

    [JsonPropertyName("latitude")]
    public double Latitude { get; set; }

    [JsonPropertyName("longitude")]
    public double Longitude { get; set; }
}

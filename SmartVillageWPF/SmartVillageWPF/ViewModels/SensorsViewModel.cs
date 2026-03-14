using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using SmartVillageWPF.Models;
using SmartVillageWPF.Services;

namespace SmartVillageWPF.ViewModels;

/// <summary>
/// ViewModel for the sensors list view.
/// Displays all sensors discovered via MQTT and their latest readings.
/// </summary>
public partial class SensorsViewModel : ObservableObject
{
    private readonly IMqttService _mqttService;

    [ObservableProperty]
    private int _totalReadingsReceived;

    [ObservableProperty]
    private string _filterText = string.Empty;

    public ObservableCollection<SensorDisplayItem> Sensors { get; } = new();

    public SensorsViewModel(IMqttService mqttService)
    {
        _mqttService = mqttService;
        _mqttService.SensorDataReceived += OnSensorDataReceived;
        _mqttService.AppSensorDataReceived += OnSensorDataReceived;
        _mqttService.DiscoveryReceived += OnDiscoveryReceived;
    }

    private void OnSensorDataReceived(object? sender, SensorReading reading)
    {
        TotalReadingsReceived++;

        var existing = Sensors.FirstOrDefault(s => s.SensorId == reading.SensorId);
        if (existing != null)
        {
            existing.LatestValue = reading.Value;
            existing.LatestTimestamp = reading.Timestamp;
            existing.Status = reading.Status;
            existing.Unit = reading.Unit ?? existing.Unit;
            existing.ReadingCount++;
        }
        else
        {
            Sensors.Add(new SensorDisplayItem
            {
                SensorId = reading.SensorId,
                Name = $"Sensor {reading.SensorId}",
                LatestValue = reading.Value,
                LatestTimestamp = reading.Timestamp,
                Status = reading.Status,
                Unit = reading.Unit ?? "?",
                ReadingCount = 1
            });
        }
    }

    private void OnDiscoveryReceived(object? sender, DiscoveryPayload discovery)
    {
        if (discovery.Sensors == null) return;

        foreach (var sensor in discovery.Sensors)
        {
            if (sensor.SensorId == null) continue;

            var existing = Sensors.FirstOrDefault(s => s.SensorId == sensor.SensorId);
            if (existing != null)
            {
                existing.Name = sensor.Name;
                existing.SensorTypeId = sensor.SensorTypeId;
                existing.Latitude = sensor.Latitude;
                existing.Longitude = sensor.Longitude;
            }
            else
            {
                Sensors.Add(new SensorDisplayItem
                {
                    SensorId = sensor.SensorId.Value,
                    Name = sensor.Name,
                    SensorTypeId = sensor.SensorTypeId,
                    Latitude = sensor.Latitude,
                    Longitude = sensor.Longitude,
                    Unit = GetUnitForSensorType(sensor.SensorTypeId)
                });
            }
        }
    }

    /// <summary>
    /// Returns the default unit for a sensor type ID.
    /// Sensor type IDs and units are from backend/prisma/seed.js.
    /// </summary>
    private static string GetUnitForSensorType(int sensorTypeId) => sensorTypeId switch
    {
        1 => "°C",        // Temperature
        2 => "%",         // Humidity
        3 => "hPa",       // Pressure
        4 => "mm",        // Rainfall
        5 => "m/s",       // Wind Speed
        6 => "W/m²",      // Solar Radiation
        7 => "%",         // Soil Moisture
        8 => "ppm",       // CO2
        9 => "Personen",  // Rideshare bench (people count)
        _ => "?"
    };
}

/// <summary>
/// Display model for a single sensor in the sensors list.
/// </summary>
public partial class SensorDisplayItem : ObservableObject
{
    [ObservableProperty]
    private int _sensorId;

    [ObservableProperty]
    private string _name = string.Empty;

    [ObservableProperty]
    private int _sensorTypeId;

    [ObservableProperty]
    private double _latestValue;

    [ObservableProperty]
    private DateTime _latestTimestamp;

    [ObservableProperty]
    private string _status = "UNKNOWN";

    [ObservableProperty]
    private string _unit = "?";

    [ObservableProperty]
    private int _readingCount;

    [ObservableProperty]
    private double? _latitude;

    [ObservableProperty]
    private double? _longitude;
}

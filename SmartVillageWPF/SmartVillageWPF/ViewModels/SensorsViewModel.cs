using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using SmartVillageWPF.Models;
using SmartVillageWPF.Services;

namespace SmartVillageWPF.ViewModels;

/// <summary>
/// ViewModel for the sensors list view.
/// Displays sensors from the App-API and live MQTT updates.
/// Respects sensorDetailVisibility flags and enableSensorData feature flag.
/// </summary>
public partial class SensorsViewModel : ObservableObject
{
    private readonly IMqttService _mqttService;

    [ObservableProperty]
    private int _totalReadingsReceived;

    [ObservableProperty]
    private string _filterText = string.Empty;

    [ObservableProperty]
    private bool _isSensorDataEnabled = true;

    // Sensor detail visibility flags (from village config)
    [ObservableProperty]
    private bool _showSensorName = true;

    [ObservableProperty]
    private bool _showSensorType = true;

    [ObservableProperty]
    private bool _showSensorDescription = true;

    [ObservableProperty]
    private bool _showSensorCoordinates = true;

    public ObservableCollection<SensorDisplayItem> Sensors { get; } = new();

    public SensorsViewModel(IMqttService mqttService)
    {
        _mqttService = mqttService;
        _mqttService.SensorDataReceived += OnSensorDataReceived;
        _mqttService.AppSensorDataReceived += OnSensorDataReceived;
        _mqttService.DiscoveryReceived += OnDiscoveryReceived;
    }

    /// <summary>
    /// Called by MainViewModel when a village is selected.
    /// Populates the sensor list from the App-API config and initial data.
    /// </summary>
    public void ApplyVillageData(VillageConfig config, InitialData initialData)
    {
        // Apply feature flag
        IsSensorDataEnabled = config.Features?.SensorData ?? true;

        // Apply sensor detail visibility
        var visibility = config.SensorDetailVisibility;
        ShowSensorName = visibility?.Name ?? true;
        ShowSensorType = visibility?.Type ?? true;
        ShowSensorDescription = visibility?.Description ?? true;
        ShowSensorCoordinates = visibility?.Coordinates ?? true;

        // Clear previous data
        Sensors.Clear();
        TotalReadingsReceived = 0;

        if (!IsSensorDataEnabled) return;

        // Build sensor display items from config (has type/unit info)
        var configSensors = config.Sensors.ToDictionary(s => s.Id);

        // Populate from initial data (includes last readings)
        if (initialData.Sensors != null)
        {
            foreach (var sensor in initialData.Sensors)
            {
                var item = new SensorDisplayItem
                {
                    SensorId = sensor.Id,
                    Name = sensor.Name,
                    SensorTypeName = sensor.Type,
                    Unit = sensor.Unit,
                    Latitude = sensor.Latitude,
                    Longitude = sensor.Longitude,
                };

                if (sensor.LastReading != null)
                {
                    item.LatestValue = sensor.LastReading.Value;
                    item.LatestTimestamp = sensor.LastReading.Ts;
                    item.Status = sensor.LastReading.Status;
                    item.ReadingCount = 1;
                    TotalReadingsReceived++;
                }

                Sensors.Add(item);
            }
        }
        else
        {
            // Fallback: populate from config sensors (no readings)
            foreach (var sensor in config.Sensors)
            {
                Sensors.Add(new SensorDisplayItem
                {
                    SensorId = sensor.Id,
                    Name = sensor.Name,
                    SensorTypeName = sensor.Type,
                    Unit = sensor.Unit,
                    Latitude = sensor.Latitude,
                    Longitude = sensor.Longitude,
                });
            }
        }
    }

    private void OnSensorDataReceived(object? sender, SensorReading reading)
    {
        if (!IsSensorDataEnabled) return;

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
                existing.Latitude = sensor.Latitude;
                existing.Longitude = sensor.Longitude;
            }
            else
            {
                Sensors.Add(new SensorDisplayItem
                {
                    SensorId = sensor.SensorId.Value,
                    Name = sensor.Name,
                    Latitude = sensor.Latitude,
                    Longitude = sensor.Longitude,
                    Unit = "?"
                });
            }
        }
    }
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
    private string _sensorTypeName = string.Empty;

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

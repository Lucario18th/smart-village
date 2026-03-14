using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using SmartVillageWPF.Models;
using SmartVillageWPF.Services;

namespace SmartVillageWPF.ViewModels;

/// <summary>
/// ViewModel for the dashboard view.
/// Displays a summary of sensor activity, recent readings, messages, and rideshares.
/// Respects village feature flags to show/hide modules.
/// </summary>
public partial class DashboardViewModel : ObservableObject
{
    private readonly IMqttService _mqttService;

    [ObservableProperty]
    private int _activeSensorCount;

    [ObservableProperty]
    private int _totalReadings;

    [ObservableProperty]
    private int _discoveredDeviceCount;

    [ObservableProperty]
    private ConnectionStatus _connectionStatus = ConnectionStatus.Disconnected;

    // Feature flags (from village config)
    [ObservableProperty]
    private bool _isSensorDataEnabled = true;

    [ObservableProperty]
    private bool _isMessagesEnabled;

    [ObservableProperty]
    private bool _isRideShareEnabled;

    [ObservableProperty]
    private bool _isWeatherEnabled;

    [ObservableProperty]
    private bool _isEventsEnabled;

    [ObservableProperty]
    private bool _isMapEnabled;

    [ObservableProperty]
    private string? _villageName;

    public ObservableCollection<SensorReading> RecentReadings { get; } = new();
    public ObservableCollection<string> DiscoveredDevices { get; } = new();
    public ObservableCollection<InitialDataMessage> Messages { get; } = new();
    public ObservableCollection<InitialDataRideShare> Rideshares { get; } = new();

    private readonly HashSet<int> _knownSensorIds = new();
    private readonly HashSet<string> _knownDeviceIds = new();

    public DashboardViewModel(IMqttService mqttService)
    {
        _mqttService = mqttService;
        _mqttService.SensorDataReceived += OnSensorDataReceived;
        _mqttService.AppSensorDataReceived += OnSensorDataReceived;
        _mqttService.DiscoveryReceived += OnDiscoveryReceived;
        _mqttService.StatusChanged += OnStatusChanged;
    }

    /// <summary>
    /// Called by MainViewModel when a village is selected.
    /// Populates dashboard data from the App-API responses.
    /// </summary>
    public void ApplyVillageData(VillageConfig config, InitialData initialData)
    {
        // Apply feature flags
        var features = config.Features;
        IsSensorDataEnabled = features?.SensorData ?? true;
        IsMessagesEnabled = features?.Messages ?? false;
        IsRideShareEnabled = features?.RideShare ?? false;
        IsWeatherEnabled = features?.Weather ?? false;
        IsEventsEnabled = features?.Events ?? false;
        IsMapEnabled = features?.Map ?? false;
        VillageName = config.Name;

        // Clear previous data
        RecentReadings.Clear();
        Messages.Clear();
        Rideshares.Clear();
        _knownSensorIds.Clear();
        _knownDeviceIds.Clear();
        DiscoveredDevices.Clear();
        TotalReadings = 0;
        DiscoveredDeviceCount = 0;

        // Populate sensors from initial data
        if (IsSensorDataEnabled && initialData.Sensors != null)
        {
            ActiveSensorCount = initialData.Sensors.Count;

            foreach (var sensor in initialData.Sensors)
            {
                _knownSensorIds.Add(sensor.Id);

                if (sensor.LastReading != null)
                {
                    RecentReadings.Add(new SensorReading
                    {
                        SensorId = sensor.Id,
                        Value = sensor.LastReading.Value,
                        Timestamp = sensor.LastReading.Ts,
                        Status = sensor.LastReading.Status,
                        Unit = sensor.Unit
                    });
                    TotalReadings++;
                }
            }
        }
        else
        {
            ActiveSensorCount = 0;
        }

        // Populate messages
        if (IsMessagesEnabled && initialData.Messages != null)
        {
            foreach (var msg in initialData.Messages)
            {
                Messages.Add(msg);
            }
        }

        // Populate rideshares
        if (IsRideShareEnabled && initialData.Rideshares != null)
        {
            foreach (var rs in initialData.Rideshares)
            {
                Rideshares.Add(rs);
            }
        }
    }

    private void OnStatusChanged(object? sender, ConnectionStatus status)
    {
        ConnectionStatus = status;
    }

    private void OnSensorDataReceived(object? sender, SensorReading reading)
    {
        if (!IsSensorDataEnabled) return;

        TotalReadings++;

        if (_knownSensorIds.Add(reading.SensorId))
        {
            ActiveSensorCount = _knownSensorIds.Count;
        }

        RecentReadings.Insert(0, reading);

        while (RecentReadings.Count > 50)
        {
            RecentReadings.RemoveAt(RecentReadings.Count - 1);
        }
    }

    private void OnDiscoveryReceived(object? sender, DiscoveryPayload discovery)
    {
        if (discovery.Device?.Name != null && _knownDeviceIds.Add(discovery.Device.Name))
        {
            DiscoveredDevices.Add(discovery.Device.Name);
            DiscoveredDeviceCount = _knownDeviceIds.Count;
        }
    }
}

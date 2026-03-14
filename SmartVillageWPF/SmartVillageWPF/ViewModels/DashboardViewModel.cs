using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using SmartVillageWPF.Models;
using SmartVillageWPF.Services;

namespace SmartVillageWPF.ViewModels;

/// <summary>
/// ViewModel for the dashboard view.
/// Displays a summary of sensor activity and recent readings.
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

    public ObservableCollection<SensorReading> RecentReadings { get; } = new();
    public ObservableCollection<string> DiscoveredDevices { get; } = new();

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

    private void OnStatusChanged(object? sender, ConnectionStatus status)
    {
        ConnectionStatus = status;
    }

    private void OnSensorDataReceived(object? sender, SensorReading reading)
    {
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

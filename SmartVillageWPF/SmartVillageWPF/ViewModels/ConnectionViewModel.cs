using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmartVillageWPF.Models;
using SmartVillageWPF.Services;

namespace SmartVillageWPF.ViewModels;

/// <summary>
/// ViewModel for the connection status panel.
/// Displays the current MQTT connection status and allows connect/disconnect.
/// </summary>
public partial class ConnectionViewModel : ObservableObject
{
    private readonly IMqttService _mqttService;

    [ObservableProperty]
    private ConnectionStatus _connectionStatus = ConnectionStatus.Disconnected;

    [ObservableProperty]
    private string _statusText = "Disconnected";

    [ObservableProperty]
    private string _brokerInfo = string.Empty;

    [ObservableProperty]
    private bool _isConnecting;

    public ObservableCollection<string> LogMessages { get; } = new();

    public ConnectionViewModel(IMqttService mqttService, IConfigService configService)
    {
        _mqttService = mqttService;
        BrokerInfo = $"{configService.MqttHost}:{configService.MqttPort}";

        _mqttService.StatusChanged += OnStatusChanged;
    }

    private void OnStatusChanged(object? sender, ConnectionStatus status)
    {
        ConnectionStatus = status;
        StatusText = status.ToString();
        IsConnecting = status == ConnectionStatus.Connecting || status == ConnectionStatus.Reconnecting;
        AddLog($"Status changed: {status}");
    }

    [RelayCommand]
    private async Task ConnectAsync()
    {
        AddLog("Connecting to MQTT broker...");
        await _mqttService.ConnectAsync();
    }

    [RelayCommand]
    private async Task DisconnectAsync()
    {
        AddLog("Disconnecting from MQTT broker...");
        await _mqttService.DisconnectAsync();
    }

    private void AddLog(string message)
    {
        var timestamped = $"[{DateTime.Now:HH:mm:ss}] {message}";
        LogMessages.Insert(0, timestamped);

        while (LogMessages.Count > 100)
        {
            LogMessages.RemoveAt(LogMessages.Count - 1);
        }
    }
}

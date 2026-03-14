using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmartVillageWPF.Models;
using SmartVillageWPF.Services;

namespace SmartVillageWPF.ViewModels;

/// <summary>
/// Main ViewModel for the application shell.
/// Manages navigation between views, village selection, and holds references to child ViewModels.
/// </summary>
public partial class MainViewModel : ObservableObject
{
    private readonly INavigationService _navigationService;
    private readonly IAppApiService _appApiService;
    private readonly IMqttService _mqttService;

    [ObservableProperty]
    private string _currentView = "Dashboard";

    [ObservableProperty]
    private string _title = "Smart Village";

    [ObservableProperty]
    private bool _isLoadingVillages;

    [ObservableProperty]
    private string? _errorMessage;

    [ObservableProperty]
    private VillageListItem? _selectedVillage;

    public ObservableCollection<VillageListItem> Villages { get; } = new();

    public DashboardViewModel DashboardViewModel { get; }
    public SensorsViewModel SensorsViewModel { get; }
    public ConnectionViewModel ConnectionViewModel { get; }

    public MainViewModel(
        INavigationService navigationService,
        IAppApiService appApiService,
        IMqttService mqttService,
        DashboardViewModel dashboardViewModel,
        SensorsViewModel sensorsViewModel,
        ConnectionViewModel connectionViewModel)
    {
        _navigationService = navigationService;
        _appApiService = appApiService;
        _mqttService = mqttService;
        DashboardViewModel = dashboardViewModel;
        SensorsViewModel = sensorsViewModel;
        ConnectionViewModel = connectionViewModel;

        _navigationService.CurrentViewChanged += OnCurrentViewChanged;
    }

    private void OnCurrentViewChanged(object? sender, string viewKey)
    {
        CurrentView = viewKey;
    }

    [RelayCommand]
    private void NavigateTo(string viewKey)
    {
        _navigationService.NavigateTo(viewKey);
    }

    /// <summary>
    /// Loads the list of villages from the App-API.
    /// Called on startup or when refreshing.
    /// </summary>
    [RelayCommand]
    private async Task LoadVillagesAsync()
    {
        IsLoadingVillages = true;
        ErrorMessage = null;

        try
        {
            var villages = await _appApiService.GetVillagesAsync();
            Villages.Clear();
            foreach (var v in villages)
            {
                Villages.Add(v);
            }

            // Auto-select first village if none selected
            if (SelectedVillage == null && Villages.Count > 0)
            {
                SelectedVillage = Villages[0];
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to load villages: {ex.Message}";
        }
        finally
        {
            IsLoadingVillages = false;
        }
    }

    /// <summary>
    /// Called when SelectedVillage changes. Loads config and initial data for the village,
    /// and subscribes the MQTT service to the village-specific topic.
    /// </summary>
    async partial void OnSelectedVillageChanged(VillageListItem? value)
    {
        if (value == null) return;

        Title = $"Smart Village – {value.Name}";
        ErrorMessage = null;

        try
        {
            // Subscribe MQTT to the selected village
            await _mqttService.SubscribeToVillageAsync(value.VillageId);

            // Load village config (features + sensors + visibility)
            var config = await _appApiService.GetVillageConfigAsync(value.VillageId);

            // Load initial data (last readings, messages, rideshares)
            var initialData = await _appApiService.GetInitialDataAsync(value.VillageId);

            // Push data to child view models
            DashboardViewModel.ApplyVillageData(config, initialData);
            SensorsViewModel.ApplyVillageData(config, initialData);
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to load village data: {ex.Message}";
        }
    }
}

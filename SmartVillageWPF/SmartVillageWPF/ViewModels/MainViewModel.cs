using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmartVillageWPF.Services;

namespace SmartVillageWPF.ViewModels;

/// <summary>
/// Main ViewModel for the application shell.
/// Manages navigation between views and holds references to child ViewModels.
/// </summary>
public partial class MainViewModel : ObservableObject
{
    private readonly INavigationService _navigationService;

    [ObservableProperty]
    private string _currentView = "Dashboard";

    [ObservableProperty]
    private string _title = "Smart Village Admin";

    public DashboardViewModel DashboardViewModel { get; }
    public SensorsViewModel SensorsViewModel { get; }
    public ConnectionViewModel ConnectionViewModel { get; }

    public MainViewModel(
        INavigationService navigationService,
        DashboardViewModel dashboardViewModel,
        SensorsViewModel sensorsViewModel,
        ConnectionViewModel connectionViewModel)
    {
        _navigationService = navigationService;
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
}

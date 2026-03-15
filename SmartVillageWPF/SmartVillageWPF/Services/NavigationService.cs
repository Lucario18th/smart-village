namespace SmartVillageWPF.Services;

/// <summary>
/// Simple navigation service that tracks the current view and notifies subscribers.
/// </summary>
public class NavigationService : INavigationService
{
    public string CurrentView { get; private set; } = "Dashboard";

    public event EventHandler<string>? CurrentViewChanged;

    public void NavigateTo(string viewKey)
    {
        if (CurrentView == viewKey) return;
        CurrentView = viewKey;
        CurrentViewChanged?.Invoke(this, viewKey);
    }
}

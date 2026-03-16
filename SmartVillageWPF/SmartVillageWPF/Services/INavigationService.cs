namespace SmartVillageWPF.Services;

/// <summary>
/// Defines the navigation service contract for switching between views.
/// </summary>
public interface INavigationService
{
    /// <summary>
    /// The key of the currently active view.
    /// </summary>
    string CurrentView { get; }

    /// <summary>
    /// Fired when the current view changes.
    /// </summary>
    event EventHandler<string>? CurrentViewChanged;

    /// <summary>
    /// Navigate to a view by its key.
    /// </summary>
    void NavigateTo(string viewKey);
}

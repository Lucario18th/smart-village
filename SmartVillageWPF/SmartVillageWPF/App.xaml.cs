using System.Windows;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SmartVillageWPF.Services;
using SmartVillageWPF.ViewModels;

namespace SmartVillageWPF;

/// <summary>
/// Application entry point. Sets up dependency injection container
/// and creates the main window with all services registered.
///
/// Uses Microsoft.Extensions.DependencyInjection as the IoC container.
/// All services, view models, and the main window are registered here.
/// </summary>
public partial class App : Application
{
    private ServiceProvider? _serviceProvider;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        var services = new ServiceCollection();
        ConfigureServices(services);
        _serviceProvider = services.BuildServiceProvider();

        var mainWindow = _serviceProvider.GetRequiredService<MainWindow>();
        mainWindow.Show();
    }

    private static void ConfigureServices(IServiceCollection services)
    {
        // Logging
        services.AddLogging(builder =>
        {
            builder.SetMinimumLevel(LogLevel.Debug);
            builder.AddConsole();
        });

        // Services (singletons for shared state)
        services.AddSingleton<IConfigService, ConfigService>();
        services.AddSingleton<INavigationService, NavigationService>();
        services.AddSingleton<IMqttService, MqttService>();

        // ViewModels (singletons so they persist across navigation)
        services.AddSingleton<MainViewModel>();
        services.AddSingleton<DashboardViewModel>();
        services.AddSingleton<SensorsViewModel>();
        services.AddSingleton<ConnectionViewModel>();

        // Main Window
        services.AddSingleton<MainWindow>();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        if (_serviceProvider is IDisposable disposable)
        {
            disposable.Dispose();
        }

        base.OnExit(e);
    }
}

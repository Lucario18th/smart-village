using SmartVillageWPF.Models;

namespace SmartVillageWPF.Services;

/// <summary>
/// Defines the contract for calling the App-API REST endpoints.
/// Base URL: http://192.168.23.113:8000 (configurable via IConfigService).
/// </summary>
public interface IAppApiService
{
    /// <summary>
    /// GET /app/villages – list of all available villages with features.
    /// </summary>
    Task<List<VillageListItem>> GetVillagesAsync();

    /// <summary>
    /// GET /app/villages/:villageId/config – village configuration including
    /// feature flags, sensor-detail visibility, and app-exposed sensors.
    /// </summary>
    Task<VillageConfig> GetVillageConfigAsync(int villageId);

    /// <summary>
    /// GET /app/villages/:villageId/initial-data – initial sensor readings,
    /// messages, rideshares (only sections enabled by feature flags are returned).
    /// </summary>
    Task<InitialData> GetInitialDataAsync(int villageId);
}

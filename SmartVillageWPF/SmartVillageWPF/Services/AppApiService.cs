using System.Net.Http;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using SmartVillageWPF.Models;

namespace SmartVillageWPF.Services;

/// <summary>
/// HTTP client for the App-API (backend port 8000).
/// All responses are wrapped in ApiResponse&lt;T&gt; { success, data, timestamp }.
/// </summary>
public class AppApiService : IAppApiService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AppApiService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public AppApiService(HttpClient httpClient, ILogger<AppApiService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<List<VillageListItem>> GetVillagesAsync()
    {
        _logger.LogInformation("Fetching villages from App-API");
        var response = await GetAsync<List<VillageListItem>>("api/app/villages");
        return response ?? new List<VillageListItem>();
    }

    public async Task<VillageConfig> GetVillageConfigAsync(int villageId)
    {
        _logger.LogInformation("Fetching village config for village {VillageId}", villageId);
        var response = await GetAsync<VillageConfig>($"api/app/villages/{villageId}/config");
        return response ?? throw new InvalidOperationException($"No config returned for village {villageId}");
    }

    public async Task<InitialData> GetInitialDataAsync(int villageId)
    {
        _logger.LogInformation("Fetching initial data for village {VillageId}", villageId);
        var response = await GetAsync<InitialData>($"api/app/villages/{villageId}/initial-data");
        return response ?? throw new InvalidOperationException($"No initial data returned for village {villageId}");
    }

    /// <summary>
    /// Generic GET helper that unwraps the ApiResponse envelope.
    /// </summary>
    private async Task<T?> GetAsync<T>(string path)
    {
        try
        {
            var httpResponse = await _httpClient.GetAsync(path);
            httpResponse.EnsureSuccessStatusCode();

            var json = await httpResponse.Content.ReadAsStringAsync();
            var envelope = JsonSerializer.Deserialize<ApiResponse<T>>(json, JsonOptions);

            if (envelope is { Success: true })
            {
                return envelope.Data;
            }

            _logger.LogWarning("App-API returned success=false for {Path}", path);
            return default;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error calling App-API at {Path}", path);
            throw;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error for App-API response at {Path}", path);
            throw;
        }
    }
}

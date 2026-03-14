using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Protocol;
using SmartVillageWPF.Models;

namespace SmartVillageWPF.Services;

/// <summary>
/// MQTT service using MQTTnet to connect to the Smart Village MQTT broker.
/// Subscribes to sensor data, discovery, and app sensor topics.
/// Provides robust reconnect logic and observable events for the rest of the application.
///
/// Topics and payloads match the existing backend MQTT service:
///   - Sensor data:  sv/{accountId}/{deviceId}/sensors/{sensorId}
///   - Discovery:    sv/{accountId}/{deviceId}/config
///   - App sensors:  app/village/{villageId}/sensors
///
/// See doku-Neu/backend/mqtt-integration.md for full documentation.
/// </summary>
public class MqttService : IMqttService, IDisposable
{
    private readonly IConfigService _config;
    private readonly ILogger<MqttService> _logger;
    private IMqttClient? _client;
    private bool _disposed;
    private CancellationTokenSource? _reconnectCts;
    private bool _intentionalDisconnect;
    private int? _currentVillageId;

    private const int ReconnectDelayMs = 5000;
    private const int MaxReconnectDelayMs = 60000;

    public ConnectionStatus Status { get; private set; } = ConnectionStatus.Disconnected;

    public event EventHandler<ConnectionStatus>? StatusChanged;
    public event EventHandler<SensorReading>? SensorDataReceived;
    public event EventHandler<DiscoveryPayload>? DiscoveryReceived;
    public event EventHandler<SensorReading>? AppSensorDataReceived;

    public MqttService(IConfigService config, ILogger<MqttService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task ConnectAsync()
    {
        if (_disposed) throw new ObjectDisposedException(nameof(MqttService));

        _intentionalDisconnect = false;
        _reconnectCts?.Cancel();
        _reconnectCts = new CancellationTokenSource();

        SetStatus(ConnectionStatus.Connecting);

        try
        {
            var factory = new MqttFactory();
            _client = factory.CreateMqttClient();

            _client.ApplicationMessageReceivedAsync += OnMessageReceivedAsync;
            _client.DisconnectedAsync += OnDisconnectedAsync;

            var optionsBuilder = new MqttClientOptionsBuilder()
                .WithTcpServer(_config.MqttHost, _config.MqttPort)
                .WithCleanSession()
                .WithKeepAlivePeriod(TimeSpan.FromSeconds(30))
                .WithTimeout(TimeSpan.FromSeconds(10));

            if (!string.IsNullOrEmpty(_config.MqttUsername))
            {
                optionsBuilder.WithCredentials(_config.MqttUsername, _config.MqttPassword);
            }

            var options = optionsBuilder.Build();

            _logger.LogInformation("Connecting to MQTT broker at {Host}:{Port}",
                _config.MqttHost, _config.MqttPort);

            await _client.ConnectAsync(options);

            _logger.LogInformation("Connected to MQTT broker. Subscribing to topics...");

            await SubscribeToTopicsAsync();

            SetStatus(ConnectionStatus.Connected);
            _logger.LogInformation("MQTT connected and subscribed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to MQTT broker at {Host}:{Port}",
                _config.MqttHost, _config.MqttPort);
            SetStatus(ConnectionStatus.Error);
            _ = ReconnectLoopAsync(_reconnectCts.Token);
        }
    }

    public async Task DisconnectAsync()
    {
        _intentionalDisconnect = true;
        _reconnectCts?.Cancel();

        if (_client?.IsConnected == true)
        {
            try
            {
                _logger.LogInformation("Disconnecting from MQTT broker");
                await _client.DisconnectAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error during MQTT disconnect");
            }
        }

        _currentVillageId = null;
        SetStatus(ConnectionStatus.Disconnected);
    }

    public async Task SubscribeToVillageAsync(int villageId)
    {
        if (_client == null || !_client.IsConnected)
        {
            _logger.LogWarning("Cannot subscribe to village {VillageId}: MQTT not connected", villageId);
            _currentVillageId = villageId;
            return;
        }

        // Unsubscribe from previous village topic if different
        if (_currentVillageId.HasValue && _currentVillageId.Value != villageId)
        {
            var oldTopic = $"app/village/{_currentVillageId.Value}/sensors";
            try
            {
                await _client.UnsubscribeAsync(oldTopic);
                _logger.LogInformation("Unsubscribed from {Topic}", oldTopic);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to unsubscribe from {Topic}", oldTopic);
            }
        }

        _currentVillageId = villageId;
        var newTopic = $"app/village/{villageId}/sensors";

        var subscribeOptions = new MqttClientSubscribeOptionsBuilder()
            .WithTopicFilter(f => f
                .WithTopic(newTopic)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtMostOnce))
            .Build();

        await _client.SubscribeAsync(subscribeOptions);
        _logger.LogInformation("Subscribed to village topic: {Topic}", newTopic);
    }

    private async Task SubscribeToTopicsAsync()
    {
        if (_client == null) return;

        var builder = new MqttClientSubscribeOptionsBuilder()
            .WithTopicFilter(f => f
                .WithTopic(_config.SensorTopicPattern)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtMostOnce))
            .WithTopicFilter(f => f
                .WithTopic(_config.DiscoveryTopicPattern)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce))
            .WithTopicFilter(f => f
                .WithTopic(_config.AppSensorTopicPattern)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtMostOnce));

        // Also subscribe to the specific village topic if one was selected before connect
        if (_currentVillageId.HasValue)
        {
            var villageTopic = $"app/village/{_currentVillageId.Value}/sensors";
            builder.WithTopicFilter(f => f
                .WithTopic(villageTopic)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtMostOnce));
            _logger.LogInformation("Also subscribing to village-specific topic: {Topic}", villageTopic);
        }

        await _client.SubscribeAsync(builder.Build());

        _logger.LogInformation("Subscribed to topics: {Sensor}, {Discovery}, {AppSensor}",
            _config.SensorTopicPattern, _config.DiscoveryTopicPattern, _config.AppSensorTopicPattern);
    }

    private Task OnMessageReceivedAsync(MqttApplicationMessageReceivedEventArgs e)
    {
        try
        {
            var topic = e.ApplicationMessage.Topic;
            var payload = Encoding.UTF8.GetString(e.ApplicationMessage.PayloadSegment);

            _logger.LogDebug("MQTT message received on topic: {Topic}", topic);

            if (topic.EndsWith("/config"))
            {
                HandleDiscoveryMessage(topic, payload);
            }
            else if (topic.StartsWith("app/village/"))
            {
                HandleAppSensorMessage(topic, payload);
            }
            else if (topic.Contains("/sensors/"))
            {
                HandleSensorDataMessage(topic, payload);
            }
            else
            {
                _logger.LogWarning("Received message on unrecognized topic: {Topic}", topic);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing MQTT message on topic: {Topic}",
                e.ApplicationMessage.Topic);
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Handles sensor data messages on topics matching: sv/{accountId}/{deviceId}/sensors/{sensorId}
    /// </summary>
    private void HandleSensorDataMessage(string topic, string payload)
    {
        var parts = topic.Split('/');
        if (parts.Length < 5 || parts[0] != "sv" || parts[3] != "sensors")
        {
            _logger.LogWarning("Invalid sensor data topic format: {Topic}", topic);
            return;
        }

        if (!int.TryParse(parts[4], out var sensorId))
        {
            _logger.LogWarning("Invalid sensor ID in topic: {Topic}", topic);
            return;
        }

        try
        {
            var data = JsonSerializer.Deserialize<SensorPayload>(payload);
            if (data == null)
            {
                _logger.LogWarning("Failed to deserialize sensor payload for topic: {Topic}", topic);
                return;
            }

            var reading = new SensorReading
            {
                SensorId = sensorId,
                Value = data.Value,
                Timestamp = ParseTimestamp(data.Timestamp),
                Status = data.Status ?? "OK",
                Unit = data.Unit
            };

            SensorDataReceived?.Invoke(this, reading);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing sensor data payload for topic: {Topic}", topic);
        }
    }

    /// <summary>
    /// Handles discovery messages on topics matching: sv/{accountId}/{deviceId}/config
    /// </summary>
    private void HandleDiscoveryMessage(string topic, string payload)
    {
        var parts = topic.Split('/');
        if (parts.Length < 4 || parts[0] != "sv" || parts[3] != "config")
        {
            _logger.LogWarning("Invalid discovery topic format: {Topic}", topic);
            return;
        }

        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var data = JsonSerializer.Deserialize<DiscoveryPayload>(payload, options);

            if (data == null)
            {
                _logger.LogWarning("Failed to deserialize discovery payload for topic: {Topic}", topic);
                return;
            }

            _logger.LogInformation("Discovery received from device on topic: {Topic}", topic);
            DiscoveryReceived?.Invoke(this, data);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing discovery payload for topic: {Topic}", topic);
        }
    }

    /// <summary>
    /// Handles app-forwarded sensor messages on topics matching: app/village/{villageId}/sensors
    /// </summary>
    private void HandleAppSensorMessage(string topic, string payload)
    {
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var data = JsonSerializer.Deserialize<AppSensorPayload>(payload, options);

            if (data == null)
            {
                _logger.LogWarning("Failed to deserialize app sensor payload for topic: {Topic}", topic);
                return;
            }

            var reading = new SensorReading
            {
                SensorId = data.SensorId,
                Value = data.Value,
                Timestamp = ParseTimestamp(data.Ts),
                Status = data.Status ?? "OK",
                Unit = data.Unit
            };

            AppSensorDataReceived?.Invoke(this, reading);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing app sensor payload for topic: {Topic}", topic);
        }
    }

    private async Task OnDisconnectedAsync(MqttClientDisconnectedEventArgs e)
    {
        if (_intentionalDisconnect)
        {
            _logger.LogInformation("MQTT disconnected intentionally");
            SetStatus(ConnectionStatus.Disconnected);
            return;
        }

        _logger.LogWarning("MQTT connection lost: {Reason}", e.Reason);
        SetStatus(ConnectionStatus.Reconnecting);

        if (_reconnectCts != null && !_reconnectCts.IsCancellationRequested)
        {
            _ = ReconnectLoopAsync(_reconnectCts.Token);
        }
    }

    private async Task ReconnectLoopAsync(CancellationToken cancellationToken)
    {
        var delay = ReconnectDelayMs;

        while (!cancellationToken.IsCancellationRequested && !_disposed)
        {
            SetStatus(ConnectionStatus.Reconnecting);
            _logger.LogInformation("Attempting MQTT reconnection in {Delay}ms", delay);

            try
            {
                await Task.Delay(delay, cancellationToken);
            }
            catch (TaskCanceledException)
            {
                return;
            }

            try
            {
                if (_client == null) return;

                var optionsBuilder = new MqttClientOptionsBuilder()
                    .WithTcpServer(_config.MqttHost, _config.MqttPort)
                    .WithCleanSession()
                    .WithKeepAlivePeriod(TimeSpan.FromSeconds(30))
                    .WithTimeout(TimeSpan.FromSeconds(10));

                if (!string.IsNullOrEmpty(_config.MqttUsername))
                {
                    optionsBuilder.WithCredentials(_config.MqttUsername, _config.MqttPassword);
                }

                await _client.ConnectAsync(optionsBuilder.Build(), cancellationToken);
                await SubscribeToTopicsAsync();

                SetStatus(ConnectionStatus.Connected);
                _logger.LogInformation("MQTT reconnected successfully");
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "MQTT reconnection attempt failed");
                delay = Math.Min(delay * 2, MaxReconnectDelayMs);
            }
        }
    }

    private void SetStatus(ConnectionStatus status)
    {
        if (Status == status) return;
        Status = status;
        StatusChanged?.Invoke(this, status);
    }

    /// <summary>
    /// Safely parses an ISO 8601 timestamp string, falling back to UTC now if parsing fails.
    /// </summary>
    private static DateTime ParseTimestamp(string? timestamp)
    {
        if (string.IsNullOrEmpty(timestamp))
            return DateTime.UtcNow;

        if (DateTime.TryParse(timestamp, null, System.Globalization.DateTimeStyles.RoundtripKind, out var parsed))
            return parsed;

        return DateTime.UtcNow;
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _reconnectCts?.Cancel();
        _reconnectCts?.Dispose();
        _client?.Dispose();
    }

    /// <summary>
    /// Internal model for app-forwarded sensor payloads.
    /// Matches the format published by MqttService.publishToApp in the backend.
    /// </summary>
    private class AppSensorPayload
    {
        public int SensorId { get; set; }
        public string? SensorName { get; set; }
        public double Value { get; set; }
        public string? Ts { get; set; }
        public string? Status { get; set; }
        public string? Unit { get; set; }
    }
}

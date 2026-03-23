package de.tif23.studienarbeit.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.overscroll
import androidx.compose.foundation.rememberOverscrollEffect
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Velocity
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import de.tif23.studienarbeit.viewmodel.SensorDetailsViewModel
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.number
import org.jetbrains.compose.resources.painterResource
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.back

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SensorDetailScreen(
    sensorId: Int,
    backStack: NavBackStack<NavKey>,
    viewModel: SensorDetailsViewModel = viewModel()
) {
    val state by viewModel.viewState.collectAsState()

    val overscrollEffect = rememberOverscrollEffect()
    val refreshThresholdPx = 140f
    var pullDistance by remember { mutableFloatStateOf(0f) }
    var refreshTriggered by remember { mutableStateOf(false) }

    LaunchedEffect(sensorId) {
        viewModel.startPolling(sensorId)
        viewModel.loadSensorVisibility()
    }

    LaunchedEffect(state.isLoading) {
        if (!state.isLoading) {
            pullDistance = 0f
            refreshTriggered = false
        }
    }

    val refreshOnOverscroll = remember(state.isLoading) {
        object : NestedScrollConnection {
            override fun onPostScroll(
                consumed: Offset,
                available: Offset,
                source: NestedScrollSource
            ): Offset {
                if (source == NestedScrollSource.UserInput) {
                    if (available.y > 0f && consumed.y == 0f) {
                        pullDistance += available.y
                        if (!refreshTriggered && !state.isLoading && pullDistance >= refreshThresholdPx) {
                            refreshTriggered = true
                            viewModel.loadSensorVisibility()
                        }
                    } else if (available.y < 0f) {
                        pullDistance = 0f
                    }
                }
                return Offset.Zero
            }

            override suspend fun onPostFling(consumed: Velocity, available: Velocity): Velocity {
                pullDistance = 0f
                refreshTriggered = false
                return Velocity.Zero
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .nestedScroll(refreshOnOverscroll)
            .overscroll(overscrollEffect)
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        if (state.sensorDetailVisibility?.name == true) {
                            Text(text = state.sensorData?.name ?: "Sensor-Details")
                        } else {
                            Text(text = "Sensor-Details")
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { backStack.removeLastOrNull() }) {
                            Icon(
                                painter = painterResource(Res.drawable.back),
                                contentDescription = "Zurück",
                            )
                        }
                    }
                )
            }
        ) { paddingValues ->
            val sensorData = state.sensorData

            if (sensorData == null || state.isLoading) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator()
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Warte auf Sensordaten...")
                }
                return@Scaffold
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item { Spacer(modifier = Modifier.height(8.dp)) }

                item {
                    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                color = MaterialTheme.colorScheme.secondaryContainer,
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier.padding(10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        painter = painterResource(sensorData.type.drawableResource),
                                        contentDescription = sensorData.type.name,
                                        tint = MaterialTheme.colorScheme.onSecondaryContainer
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Aktuelle Messung",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "${formatReadingValue(sensorData.lastReading?.value)} ${sensorData.unit}",
                                    style = MaterialTheme.typography.headlineMedium,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "Stand: ${formatTimestamp(sensorData.lastReading?.timestamp)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }

                item {
                    ElevatedCard(modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                text = "Status & Info",
                                style = MaterialTheme.typography.titleMedium
                            )
                            DetailRow("Sensor-ID", sensorData.id.toString())
                            if (state.sensorDetailVisibility?.type?: true) {
                                DetailRow("Typ", formatSensorType(sensorData.type.name))
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Status",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                StatusBadge(status = sensorData.lastReading?.status)
                            }
                            DetailRow(
                                "Letztes Update",
                                formatTimestamp(sensorData.lastReading?.timestamp)
                            )
                        }
                    }
                }
                if (state.sensorDetailVisibility?.coordinates?: true) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceContainerLow
                            )
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Text(
                                    text = "Standort",
                                    style = MaterialTheme.typography.titleMedium
                                )
                                if (sensorData.coordinates != null) {
                                    DetailRow("Breitengrad", sensorData.coordinates.lat.toString())
                                    DetailRow("Längengrad", sensorData.coordinates.lon.toString())
                                }
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(8.dp)) }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(text = value, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun StatusBadge(status: String?) {
    val normalizedStatus = status?.trim().orEmpty()
    val containerColor = when {
        normalizedStatus.equals("ok", ignoreCase = true) ||
                normalizedStatus.equals(
                    "online",
                    ignoreCase = true
                ) -> MaterialTheme.colorScheme.primaryContainer

        normalizedStatus.equals(
            "warning",
            ignoreCase = true
        ) -> MaterialTheme.colorScheme.tertiaryContainer

        normalizedStatus.equals("error", ignoreCase = true) ||
                normalizedStatus.equals(
                    "offline",
                    ignoreCase = true
                ) -> MaterialTheme.colorScheme.errorContainer

        else -> MaterialTheme.colorScheme.surfaceVariant
    }

    val contentColor = when {
        normalizedStatus.equals("error", ignoreCase = true) ||
                normalizedStatus.equals(
                    "offline",
                    ignoreCase = true
                ) -> MaterialTheme.colorScheme.onErrorContainer

        normalizedStatus.equals(
            "warning",
            ignoreCase = true
        ) -> MaterialTheme.colorScheme.onTertiaryContainer

        normalizedStatus.equals("ok", ignoreCase = true) ||
                normalizedStatus.equals(
                    "online",
                    ignoreCase = true
                ) -> MaterialTheme.colorScheme.onPrimaryContainer

        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Surface(color = containerColor, shape = RoundedCornerShape(999.dp)) {
        Text(
            text = normalizedStatus.ifBlank { "-" },
            style = MaterialTheme.typography.labelMedium,
            color = contentColor,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}

private fun formatReadingValue(value: Double?): String = value?.toString() ?: "-"

private fun formatSensorType(typeName: String): String {
    return typeName
        .lowercase()
        .split('_')
        .joinToString(" ") { part ->
            part.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        }
}

private fun formatTimestamp(timestamp: LocalDateTime?): String {
    if (timestamp == null) {
        return "-"
    }
    val day = timestamp.day.toString().padStart(2, '0')
    val month = timestamp.month.number.toString().padStart(2, '0')
    val year = timestamp.year
    val hour = timestamp.hour.toString().padStart(2, '0')
    val minute = timestamp.minute.toString().padStart(2, '0')
    return "$day.$month.$year $hour:$minute"
}


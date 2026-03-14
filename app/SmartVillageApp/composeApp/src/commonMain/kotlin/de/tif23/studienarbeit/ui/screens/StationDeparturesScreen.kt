package de.tif23.studienarbeit.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import de.tif23.studienarbeit.viewmodel.StationDeparturesViewModel
import de.tif23.studienarbeit.viewmodel.data.StationDeparture
import de.tif23.studienarbeit.viewmodel.data.TrainType
import de.tif23.studienarbeit.viewmodel.data.TripStatus
import kotlinx.datetime.LocalDateTime
import org.jetbrains.compose.resources.painterResource
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.back
import smartvillageapp.composeapp.generated.resources.train

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StationDeparturesScreen(
    backStack: NavBackStack<NavKey>,
    viewModel: StationDeparturesViewModel = viewModel()
) {
    val state by viewModel.viewState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = state.stationName,
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = { backStack.removeLastOrNull() }
                    ) {
                        Icon(
                            painter = painterResource(Res.drawable.back),
                            contentDescription = "Zurück",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        painter = painterResource(Res.drawable.train),
                        contentDescription = "Bahnhof",
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        state.distanceLabel,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = state.currentFilter == null,
                        onClick = { viewModel.applyFilter(null) },
                        label = { Text("Alle") })
                    FilterChip(
                        selected = state.currentFilter == TrainType.LONG_DISTANCE,
                        onClick = { viewModel.applyFilter(TrainType.LONG_DISTANCE) },
                        label = { Text("Fern") })
                    FilterChip(
                        selected = state.currentFilter == TrainType.REGIONAL,
                        onClick = { viewModel.applyFilter(TrainType.REGIONAL) },
                        label = { Text("Regional") })
                    FilterChip(
                        selected = state.currentFilter == TrainType.S,
                        onClick = { viewModel.applyFilter(TrainType.S) },
                        label = { Text("S-Bahn") })
                }
            }

            if (state.isLoading) {
                item {
                    Text("Abfahrten werden geladen...")
                }
            }

            state.errorMessage?.let { error ->
                item {
                    Text(
                        text = error,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            if (!state.isLoading && state.errorMessage == null && state.departures.isEmpty()) {
                item {
                    Text("Keine Abfahrten gefunden")
                }
            }

            item {
                state.filteredDepartures.forEachIndexed { index, departure ->
                    StationDepartureCard(departure)
                    if (index < state.filteredDepartures.lastIndex) {
                        Spacer(modifier = Modifier.height(4.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
                    }
                }
            }
        }
    }
}

@Composable
private fun StationDepartureCard(item: StationDeparture) {
    val changedLine = item.changedLine?.takeIf { it.isNotBlank() && it != item.line }
    val changedDestination = item.changedDestination?.takeIf { it.isNotBlank() && it != item.destination }
    val changedStops = item.changedStops?.takeIf { it.isNotEmpty() && it != item.stops }
    val changedPlatform = item.changedPlatform?.takeIf { it.isNotBlank() && it != item.platform }
    val changedDeparture = item.changedDeparture?.takeIf { it != item.departure }
    val plannedStops = item.stops.takeIf { it.isNotEmpty() }?.let { formatStops(it) }
    val changedStopsLabel = changedStops?.let { formatStops(it) }
    val statusLabel = formatTripStatusLabel(item.status)

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    painter = painterResource(Res.drawable.train),
                    contentDescription = "Abfahrt",
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                DeviationAwareText(
                    plannedValue = "${formatTime(item.departure)}  ${item.line}",
                    changedValue = changedDeparture?.let { "${formatTime(it)}  ${changedLine ?: item.line}" }
                        ?: changedLine?.let { "${formatTime(item.departure)}  $it" },
                    style = MaterialTheme.typography.titleMedium,
                    unchangedFontWeight = FontWeight.Bold,
                    changedFontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            DeviationAwareText(
                plannedValue = "-> ${item.destination}",
                changedValue = changedDestination?.let { "-> $it" },
                style = MaterialTheme.typography.bodyMedium,
                unchangedFontWeight = FontWeight.SemiBold,
                changedFontWeight = FontWeight.SemiBold
            )
            plannedStops?.let {
                DeviationAwareText(
                    plannedValue = "über $it",
                    changedValue = changedStopsLabel?.let { value -> "über $value" },
                    style = MaterialTheme.typography.bodySmall,
                    plannedChangedColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            DeviationAwareText(
                plannedValue = "Gleis ${item.platform}",
                changedValue = changedPlatform?.let { "Gleis $it" },
                style = MaterialTheme.typography.bodySmall,
                plannedChangedColor = MaterialTheme.colorScheme.onSurfaceVariant
            )
            statusLabel?.let {
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
private fun DeviationAwareText(
    plannedValue: String,
    changedValue: String?,
    style: TextStyle,
    modifier: Modifier = Modifier,
    unchangedFontWeight: FontWeight? = null,
    changedFontWeight: FontWeight? = null,
    plannedChangedColor: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurfaceVariant
) {
    if (changedValue == null) {
        Text(
            text = plannedValue,
            modifier = modifier,
            style = style,
            fontWeight = unchangedFontWeight
        )
        return
    }

    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = plannedValue,
            style = style,
            textDecoration = TextDecoration.LineThrough,
            color = plannedChangedColor,
            fontWeight = unchangedFontWeight
        )
        Text(
            text = changedValue,
            style = style,
            color = MaterialTheme.colorScheme.error,
            fontWeight = changedFontWeight
        )
    }
}

private fun formatTime(dateTime: LocalDateTime): String {
    return "${dateTime.hour.toString().padStart(2, '0')}:${dateTime.minute.toString().padStart(2, '0')}"
}

private fun formatStops(stops: List<String>, maxVisibleStops: Int = 3): String {
    val shownStops = stops.take(maxVisibleStops).joinToString(", ")
    return if (stops.size > maxVisibleStops) "$shownStops ..." else shownStops
}

private fun formatTripStatusLabel(status: TripStatus?): String? {
    return when (status) {
        TripStatus.CANCELED -> "Ausfall"
        TripStatus.ADDED -> "Zusatzfahrt"
        TripStatus.PLANNED, null -> null
    }
}


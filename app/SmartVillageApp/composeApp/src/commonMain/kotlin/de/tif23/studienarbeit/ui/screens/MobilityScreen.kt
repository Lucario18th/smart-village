package de.tif23.studienarbeit.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import de.tif23.studienarbeit.ui.components.NavBar
import de.tif23.studienarbeit.util.NavBarTabs
import de.tif23.studienarbeit.viewmodel.MobilityViewModel
import de.tif23.studienarbeit.viewmodel.NavDestinations
import de.tif23.studienarbeit.viewmodel.data.Station
import de.tif23.studienarbeit.viewmodel.data.StationDeparture
import de.tif23.studienarbeit.viewmodel.data.TripStatus
import de.tif23.studienarbeit.viewmodel.data.state.MobilityViewModelState
import kotlinx.datetime.LocalDateTime
import org.jetbrains.compose.resources.painterResource
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.background_dark
import smartvillageapp.composeapp.generated.resources.background_light
import smartvillageapp.composeapp.generated.resources.settings
import smartvillageapp.composeapp.generated.resources.train
import smartvillageapp.composeapp.generated.resources.transportation

@OptIn(ExperimentalMaterial3Api::class)
@Composable
@Suppress("UNUSED_PARAMETER")
fun MobilityScreen(
    backStack: NavBackStack<NavKey>,
    mobilityViewModel: MobilityViewModel = viewModel()
) {
    val state by mobilityViewModel.viewState.collectAsState()
    
    var selectedTabIndex by rememberSaveable { mutableStateOf(0) }
    val tabs = listOf("Mitfahren", "ÖPNV", "Route")
    val backgroundPainter = painterResource(
        if (isSystemInDarkTheme()) Res.drawable.background_dark else Res.drawable.background_light
    )

    Box(modifier = Modifier.fillMaxSize()) {
        Image(
            painter = backgroundPainter,
            contentDescription = null,
            modifier = Modifier.matchParentSize(),
            contentScale = ContentScale.Crop
        )

        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text("Mobilität") },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.Transparent,
                        scrolledContainerColor = Color.Transparent
                    )
                )
            },
            bottomBar = {
                NavBar(backStack, NavBarTabs.MOBILITY)
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                PrimaryTabRow(selectedTabIndex = selectedTabIndex) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTabIndex == index,
                            onClick = { selectedTabIndex = index },
                            text = { Text(title, fontWeight = FontWeight.Bold) }
                        )
                    }
                }

                when (selectedTabIndex) {
                    0 -> CarpoolTabContent(backStack, mobilityViewModel, state)
                    1 -> TransitTabContent(backStack, mobilityViewModel, state)
                    else -> RoutingTabContent()
                }
            }
        }
    }
}

@Composable
private fun CarpoolTabContent(
    backStack: NavBackStack<NavKey>,
    mobilityViewModel: MobilityViewModel,
    state: MobilityViewModelState
) {
    LaunchedEffect(Unit) {
        mobilityViewModel.loadRidesharePoints()
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (state.isLoadingRidesharePoints) {
            item {
                Text("Mitfahrbänke werden geladen...")
            }
        }

        state.ridesharePointErrorMessage?.let { error ->
            item {
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        if (!state.isLoadingRidesharePoints && state.ridesharePointErrorMessage == null && state.ridesharePoints.isEmpty()) {
            item {
                Text("Keine Mitfahrbänke verfügbar")
            }
        }

        items(state.ridesharePoints) { ridesharePoint ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            painter = painterResource(Res.drawable.transportation),
                            contentDescription = "Mitfahren",
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = ridesharePoint.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(text = ridesharePoint.description)
                    Text(
                        text = "Eingetragen: ${ridesharePoint.personCount} / ${ridesharePoint.maxCapacity}",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = {
                            backStack.add(
                                NavDestinations.RidesharePointDetailScreen(
                                    pointId = ridesharePoint.id,
                                    name = ridesharePoint.name,
                                    description = ridesharePoint.description,
                                    personCount = ridesharePoint.personCount,
                                    maxCapacity = ridesharePoint.maxCapacity,
                                    latitude = ridesharePoint.coordinates.lat,
                                    longitude = ridesharePoint.coordinates.lon
                                )
                            )
                        }
                    ) {
                        Text("Details")
                    }
                }
            }
        }
    }
}

@Composable
private fun TransitTabContent(
    backStack: NavBackStack<NavKey>,
    mobilityViewModel: MobilityViewModel,
    state: MobilityViewModelState
) {
    LaunchedEffect(Unit) {
        mobilityViewModel.loadStations()
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    painter = painterResource(Res.drawable.train),
                    contentDescription = "Bahnhöfe",
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Bahnhöfe",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }

        if (state.isLoadingStations) {
            item {
                Text("Abfahrten werden geladen...")
            }
        }

        state.stationErrorMessage?.let { error ->
            item {
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        if (!state.isLoadingStations && state.stationErrorMessage == null && state.stations.isEmpty()) {
            item {
                Text("Keine Bahnhöfe verfuegbar")
            }
        }

        items(state.stations) { station ->
            StationCard(
                station = station,
                onShowAllDepartures = {
                    backStack.add(NavDestinations.StationScreen(station.evaNo))
                }
            )
        }
    }
}

@Composable
private fun RoutingTabContent() {
    val routeOptions = listOf(
        RouteOption("Auto", "25 Min - 18 km - über B33"),
        RouteOption("ÖPNV", "45 Min - Bus 204 + RE 2"),
        RouteOption("Rad", "55 Min - 15 km - Radweg R3")
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            OutlinedTextField(
                value = "Mein Standort",
                onValueChange = { },
                readOnly = true,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Von") }
            )
        }
        item {
            OutlinedTextField(
                value = "Freiburg Hbf",
                onValueChange = { },
                readOnly = true,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Nach") }
            )
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = true, onClick = { }, label = { Text("Auto") })
                FilterChip(selected = false, onClick = { }, label = { Text("ÖPNV") })
                FilterChip(selected = false, onClick = { }, label = { Text("Rad") })
                FilterChip(selected = false, onClick = { }, label = { Text("Fuß") })
            }
        }
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            painter = painterResource(Res.drawable.settings),
                            contentDescription = "Karte",
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Kartenplatzhalter", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
        items(routeOptions) { option ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(option.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(option.subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

@Composable
private fun StationCard(
    station: Station,
    onShowAllDepartures: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        painter = painterResource(Res.drawable.train),
                        contentDescription = "Bahnhof",
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = station.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(text = station.distance, style = MaterialTheme.typography.bodySmall)
            }
            Spacer(modifier = Modifier.height(8.dp))

            if (station.departures.isEmpty()) {
                Text(
                    text = "Keine Abfahrten verfügbar",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                station.departures.forEachIndexed { index, departure ->
                    DepartureRow(departure)
                    if (index < station.departures.lastIndex) {
                        HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            TextButton(onClick = onShowAllDepartures, enabled = true) {
                Text("Alle Abfahrten")
            }
        }
    }
}

@Composable
private fun DepartureRow(departure: StationDeparture) {
    val changedLine = departure.changedLine?.takeIf { it.isNotBlank() && it != departure.line }
    val changedDestination = departure.changedDestination?.takeIf {
        it.isNotBlank() && it != departure.destination
    }
    val changedStops = departure.changedStops?.takeIf { it.isNotEmpty() && it != departure.stops }
    val changedPlatform = departure.changedPlatform?.takeIf { it.isNotBlank() && it != departure.platform }
    val changedDeparture = departure.changedDeparture?.takeIf { it != departure.departure }
    val plannedStops = departure.stops.takeIf { it.isNotEmpty() }?.let { formatStops(it) }
    val changedStopsLabel = changedStops?.let { formatStops(it) }
    val statusLabel = formatTripStatusLabel(departure.status)

    val plannedHeadline = "${departure.line} - ${departure.destination}"
    val changedHeadline = if (changedLine != null || changedDestination != null) {
        "${changedLine ?: departure.line} - ${changedDestination ?: departure.destination}"
    } else {
        null
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            DeviationAwareText(
                plannedValue = plannedHeadline,
                changedValue = changedHeadline,
                style = MaterialTheme.typography.bodyMedium,
                unchangedFontWeight = FontWeight.SemiBold,
                changedFontWeight = FontWeight.SemiBold
            )

            DeviationAwareText(
                plannedValue = "Gleis ${departure.platform}",
                changedValue = changedPlatform?.let { "Gleis $it" },
                style = MaterialTheme.typography.bodySmall,
                unchangedColor = MaterialTheme.colorScheme.primary,
                unchangedFontWeight = FontWeight.Medium,
                plannedChangedColor = MaterialTheme.colorScheme.primary
            )

            plannedStops?.let {
                DeviationAwareText(
                    plannedValue = "über $it",
                    changedValue = changedStopsLabel?.let { value -> "über $value" },
                    style = MaterialTheme.typography.bodySmall,
                    unchangedColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    plannedChangedColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        Spacer(modifier = Modifier.width(12.dp))

        Column(horizontalAlignment = Alignment.End) {
            DeviationAwareText(
                plannedValue = formatTime(departure.departure),
                changedValue = changedDeparture?.let { formatTime(it) },
                style = MaterialTheme.typography.bodySmall
            )

            statusLabel?.let {
                Text(
                    text = it,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.error,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
    Spacer(modifier = Modifier.height(8.dp))
}

@Composable
private fun DeviationAwareText(
    plannedValue: String,
    changedValue: String?,
    style: TextStyle,
    modifier: Modifier = Modifier,
    unchangedColor: Color = Color.Unspecified,
    unchangedFontWeight: FontWeight? = null,
    changedFontWeight: FontWeight? = null,
    plannedChangedColor: Color = MaterialTheme.colorScheme.onSurfaceVariant
) {
    if (changedValue == null) {
        Text(
            text = plannedValue,
            modifier = modifier,
            style = style,
            color = unchangedColor,
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
            color = plannedChangedColor,
            textDecoration = TextDecoration.LineThrough,
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

private data class RouteOption(
    val title: String,
    val subtitle: String
)


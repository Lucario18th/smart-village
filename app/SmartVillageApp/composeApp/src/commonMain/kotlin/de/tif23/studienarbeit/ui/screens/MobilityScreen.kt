package de.tif23.studienarbeit.ui.screens

import androidx.compose.foundation.clickable
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
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import de.tif23.studienarbeit.viewmodel.NavDestinations

@OptIn(ExperimentalMaterial3Api::class)
@Composable
@Suppress("UNUSED_PARAMETER")
fun MobilityScreen(backStack: NavBackStack<NavKey>) {
    var selectedTabIndex by rememberSaveable { mutableStateOf(0) }
    val tabs = listOf("Mitfahren", "ÖPNV", "Route")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mobilität") }
            )
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
                        text = { Text(title) }
                    )
                }
            }

            when (selectedTabIndex) {
                0 -> CarpoolTabContent(backStack)
                1 -> TransitTabContent(backStack)
                else -> RoutingTabContent()
            }
        }
    }
}

@Composable
private fun CarpoolTabContent(backStack: NavBackStack<NavKey>) {
    val rides = listOf(
        RideOffer("Freiburg", "Morgen, 10:00", "Max M.", "3 Plätze frei"),
        RideOffer("Offenburg", "Fr, 14:30", "Lisa K.", "1 Platz frei"),
        RideOffer("Karlsruhe Hbf", "Sa, 08:00", "Tom R.", "2 Plätze frei")
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(rides) { ride ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Ziel: ${ride.destination}", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(text = "Zeit: ${ride.time}")
                    Text(text = "Fahrerin/Fahrer: ${ride.driver} - ${ride.seats}")
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = { backStack.add(NavDestinations.RideDetailsScreen("abc")) }) {
                        Text("Mitfahren anfragen")
                    }
                }
            }
        }
    }
}

@Composable
private fun TransitTabContent(backStack: NavBackStack<NavKey>) {
    val nearbyStops = listOf(
        StopDepartures(
            "Hauptstrasse",
            "~250m",
            listOf(
                Departure("Bus 204", "Offenburg", "3 Min", "Pünktlich"),
                Departure("Bus 204", "Gengenbach", "12 Min", "Pünktlich"),
                Departure("Bus 7", "Kehl", "18 Min", "Pünktlich")
            )
        ),
        StopDepartures(
            "Rathaus",
            "~400m",
            listOf(
                Departure("Bus 101", "Lahr", "7 Min", "Pünktlich"),
                Departure("Bus 101", "Haslach", "22 Min", "+5 Min")
            )
        )
    )

    val stations = listOf(
        StationDepartures(
            "Offenburg Hbf",
            "~8km",
            listOf(
                Departure("ICE 72", "Freiburg", "14:02", "Pünktlich"),
                Departure("RE 2", "Karlsruhe", "14:15", "Pünktlich"),
                Departure("S1", "Strasbourg", "14:31", "+5 Min")
            )
        ),
        StationDepartures(
            "Appenweier Bf",
            "~5km",
            listOf(
                Departure("RE 2", "Offenburg", "14:22", "Pünktlich"),
                Departure("RB 26", "Kehl", "14:45", "Pünktlich")
            )
        )
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Nächste Haltestellen",
                style = MaterialTheme.typography.titleMedium
            )
        }
        items(nearbyStops) { stop ->
            StopCard(stop) {
                backStack.add(NavDestinations.StationScreen)
            }
        }
        item {
            Text(
                text = "Bahnhöfe",
                style = MaterialTheme.typography.titleMedium
            )
        }
        items(stations) { station ->
            StationCard(station)
        }
    }
}

@Composable
private fun RoutingTabContent() {
    val routeOptions = listOf(
        RouteOption("Auto", "25 Min - 18 km - über B33"),
        RouteOption("OePNV", "45 Min - Bus 204 + RE 2"),
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
                FilterChip(selected = false, onClick = { }, label = { Text("OePNV") })
                FilterChip(selected = false, onClick = { }, label = { Text("Rad") })
                FilterChip(selected = false, onClick = { }, label = { Text("Fuss") })
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
                    Text("Kartenplatzhalter", style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
        items(routeOptions) { option ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(option.title, style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(option.subtitle)
                }
            }
        }
    }
}

@Composable
private fun StopCard(
    stop: StopDepartures,
    onClick: () -> Unit = { }
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Haltestelle: ${stop.name}",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.clickable { onClick() }
                )
                Text(text = stop.distance, style = MaterialTheme.typography.bodySmall)
            }
            Spacer(modifier = Modifier.height(8.dp))
            stop.departures.forEach { departure ->
                DepartureRow(departure)
            }
        }
    }
}

@Composable
private fun StationCard(station: StationDepartures) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(text = "Bahnhof: ${station.name}", style = MaterialTheme.typography.titleMedium)
                Text(text = station.distance, style = MaterialTheme.typography.bodySmall)
            }
            Spacer(modifier = Modifier.height(8.dp))
            station.departures.forEach { departure ->
                DepartureRow(departure)
            }
            Spacer(modifier = Modifier.height(8.dp))
            TextButton(onClick = { }) {
                Text("Alle Abfahrten")
            }
        }
    }
}

@Composable
private fun DepartureRow(departure: Departure) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text("${departure.line} - ${departure.destination}")
            Text(
                text = departure.status,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Text(departure.time, style = MaterialTheme.typography.bodySmall)
    }
    Spacer(modifier = Modifier.height(8.dp))
}

private data class RideOffer(
    val destination: String,
    val time: String,
    val driver: String,
    val seats: String
)

private data class StopDepartures(
    val name: String,
    val distance: String,
    val departures: List<Departure>
)

private data class StationDepartures(
    val name: String,
    val distance: String,
    val departures: List<Departure>
)

private data class Departure(
    val line: String,
    val destination: String,
    val time: String,
    val status: String
)

private data class RouteOption(
    val title: String,
    val subtitle: String
)

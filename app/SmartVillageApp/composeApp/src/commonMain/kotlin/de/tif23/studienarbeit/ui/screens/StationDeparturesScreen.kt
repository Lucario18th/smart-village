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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey

@OptIn(ExperimentalMaterial3Api::class)
@Composable
@Suppress("UNUSED_PARAMETER")
fun StationDeparturesScreen(backStack: NavBackStack<NavKey>) {
    val departures = listOf(
        StationDepartureRow("14:02", "ICE 72", "Freiburg", "Gleis 3 - Puenktlich"),
        StationDepartureRow("14:15", "RE 2", "Karlsruhe", "Gleis 1 - Puenktlich"),
        StationDepartureRow("14:31", "S1", "Strasbourg", "Gleis 4 - +5 Min"),
        StationDepartureRow("14:45", "Bus 204", "Gengenbach", "Halteplatz C - Puenktlich"),
        StationDepartureRow("15:02", "ICE 108", "Frankfurt", "Gleis 2 - +18 Min"),
        StationDepartureRow("15:15", "RB 26", "Appenweier", "Gleis 5 - Puenktlich")
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Offenburg Hbf") }
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
                Text("~8km entfernt", style = MaterialTheme.typography.bodySmall)
                Spacer(modifier = Modifier.height(8.dp))
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = true, onClick = { }, label = { Text("Alle") })
                    FilterChip(selected = false, onClick = { }, label = { Text("Fern") })
                    FilterChip(selected = false, onClick = { }, label = { Text("Regional") })
                    FilterChip(selected = false, onClick = { }, label = { Text("Bus") })
                }
            }
            items(departures) { item ->
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text("${item.time}  ${item.line}", style = MaterialTheme.typography.titleMedium)
                    Text("-> ${item.destination}")
                    Text(item.status, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

private data class StationDepartureRow(
    val time: String,
    val line: String,
    val destination: String,
    val status: String
)

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
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import de.tif23.studienarbeit.model.usecase.StationDepartureItem
import de.tif23.studienarbeit.viewmodel.StationDeparturesViewModel
import org.jetbrains.compose.resources.painterResource
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.settings

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StationDeparturesScreen(
    backStack: NavBackStack<NavKey>,
    stationId: String,
    stationName: String,
    distanceLabel: String,
    stationDeparturesViewModel: StationDeparturesViewModel = viewModel()
) {
    val uiState by stationDeparturesViewModel.uiState.collectAsState()

    LaunchedEffect(stationId, stationName, distanceLabel) {
        stationDeparturesViewModel.load(
            stationId = stationId,
            stationName = stationName,
            distanceLabel = distanceLabel
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(uiState.stationName) }
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
                        painter = painterResource(Res.drawable.settings),
                        contentDescription = "Bahnhof",
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        uiState.distanceLabel,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
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

            if (uiState.isLoading) {
                item {
                    Text("Abfahrten werden geladen...")
                }
            }

            uiState.errorMessage?.let { error ->
                item {
                    Text(
                        text = error,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            if (!uiState.isLoading && uiState.errorMessage == null && uiState.departures.isEmpty()) {
                item {
                    Text("Keine Abfahrten gefunden")
                }
            }

            items(uiState.departures) { item ->
                StationDepartureCard(item)
                Spacer(modifier = Modifier.height(4.dp))
                HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
            }
        }
    }
}

@Composable
private fun StationDepartureCard(item: StationDepartureItem) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    painter = painterResource(Res.drawable.settings),
                    contentDescription = "Abfahrt",
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "${item.time}  ${item.line}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text("-> ${item.destination}", fontWeight = FontWeight.SemiBold)
            Text(item.status, style = MaterialTheme.typography.bodySmall)
        }
    }
}

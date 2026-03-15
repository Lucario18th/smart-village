package de.tif23.studienarbeit.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import de.tif23.studienarbeit.ui.components.DepartureRow
import de.tif23.studienarbeit.ui.components.RequestLocationPermission
import de.tif23.studienarbeit.util.getPlatform
import de.tif23.studienarbeit.viewmodel.MapScreenViewModel
import de.tif23.studienarbeit.viewmodel.NavDestinations
import de.tif23.studienarbeit.viewmodel.data.state.MapSheetContent
import kotlinx.datetime.LocalDateTime
import org.jetbrains.compose.resources.painterResource
import ovh.plrapps.mapcompose.ui.MapUI
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.back
import smartvillageapp.composeapp.generated.resources.cloud_circle
import smartvillageapp.composeapp.generated.resources.parkbank_location
import smartvillageapp.composeapp.generated.resources.train

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapScreen(
    backStack: NavBackStack<NavKey>,
    viewModel: MapScreenViewModel = viewModel()
) {
    val state by viewModel.viewState.collectAsState()

    if (getPlatform().name == "Android") {
        RequestLocationPermission {
            viewModel.startLocationTracking()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Karte") },
                navigationIcon = {
                    IconButton(onClick = { backStack.removeLastOrNull() }) {
                        Icon(
                            painter = painterResource(Res.drawable.back),
                            contentDescription = "Zuruck"
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            MapUI(state = viewModel.mapState)

            if (state.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = MaterialTheme.colorScheme.primary
                )
            }

            if (!state.isLoading && state.village == null) {
                Text(
                    text = "Dorfdaten konnten nicht geladen werden.",
                    color = MaterialTheme.colorScheme.error,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .align(Alignment.Center)
                        .padding(24.dp)
                )
            }
        }

        val sheetContent = state.sheetContent
        if (sheetContent != null) {
            ModalBottomSheet(
                onDismissRequest = { viewModel.dismissSheet() }
            ) {
            }

            SheetContent(content = sheetContent, backStack)
        }
    }
}


@Composable
private fun SheetContent(content: MapSheetContent, backStack: NavBackStack<NavKey>) {
    when (content) {
        is MapSheetContent.Container -> {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                Text(
                    text = "Recyclingcontainer",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = content.label,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(top = 8.dp, bottom = 12.dp)
                )
            }
        }

        is MapSheetContent.Sensor -> {
            val icon = if (content.isRideshareBench) {
                Res.drawable.parkbank_location
            } else {
                Res.drawable.cloud_circle
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp),
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .clickable { backStack.add(NavDestinations.SensorDetailScreen(content.id)) }
                ) {
                    Icon(
                        painter = painterResource(icon),
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        text = content.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    text = if (content.isRideshareBench) {
                        "Wartende Personen: ${content.value}"
                    } else {
                        "Aktueller Wert: ${content.value} ${content.unit}"
                    },
                    style = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier.padding(top = 12.dp)
                )
                Text(
                    text = content.type,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                )
            }
        }

        is MapSheetContent.Station -> {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.clickable {
                        backStack.add(
                            NavDestinations.StationScreen(
                                content.evaNo
                            )
                        )
                    }
                ) {
                    Icon(
                        painter = painterResource(Res.drawable.train),
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        text = content.stationName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }

                Text(
                    text = "Nächste Abfahrten",
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.padding(top = 12.dp)
                )

                when {
                    content.isLoading -> {
                        Text(
                            text = "Abfahrten werden geladen...",
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.padding(top = 8.dp, bottom = 12.dp)
                        )
                    }

                    content.errorMessage != null -> {
                        Text(
                            text = content.errorMessage,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.padding(top = 8.dp, bottom = 12.dp)
                        )
                    }

                    content.departures.isEmpty() -> {
                        Text(
                            text = "Keine Abfahrten verfügbar",
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.padding(top = 8.dp, bottom = 12.dp)
                        )
                    }

                    else -> {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(180.dp)
                                .padding(top = 8.dp)
                        ) {
                            items(content.departures.size) { index ->
                                val departure = content.departures[index]
                                DepartureRow(departure)
                                if (index < content.departures.lastIndex) {
                                    HorizontalDivider()
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun formatTime(dateTime: LocalDateTime): String {
    return "${dateTime.hour.toString().padStart(2, '0')}:${
        dateTime.minute.toString().padStart(2, '0')
    }"
}



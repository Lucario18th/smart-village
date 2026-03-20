package de.tif23.studienarbeit.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
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
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import de.tif23.studienarbeit.ui.components.NavBar
import de.tif23.studienarbeit.util.NavBarTabs
import de.tif23.studienarbeit.viewmodel.NavDestinations
import de.tif23.studienarbeit.viewmodel.SensorViewModel
import de.tif23.studienarbeit.viewmodel.data.Sensor
import org.jetbrains.compose.resources.painterResource
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.background_dark
import smartvillageapp.composeapp.generated.resources.background_light

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SensorsScreen(
    backStack: NavBackStack<NavKey>,
    sensorViewModel: SensorViewModel = viewModel()
) {
    val uiState by sensorViewModel.viewState.collectAsState()

    LaunchedEffect(Unit) {
        sensorViewModel.startPolling()
    }
    DisposableEffect(Unit) {
        onDispose { sensorViewModel.stopPolling() }
    }

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
                    title = { Text("Sensoren") },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.Transparent,
                        scrolledContainerColor = Color.Transparent
                    )
                )
            },
            bottomBar = {
                NavBar(backStack, NavBarTabs.SENSORS)
            }
        ) { paddingValues ->
            when {
                uiState.isLoading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }

                uiState.errorMessage != null -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = uiState.errorMessage!!,
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.padding(24.dp)
                        )
                    }
                }

                uiState.groupedSensors.isEmpty() -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Keine Sensoren verfügbar")
                    }
                }

                else -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                    ) {
                        uiState.groupedSensors.forEach { group ->
                            item {
                                Text(
                                    text = group.coordinatesLabel,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.padding(
                                        start = 16.dp,
                                        top = 16.dp,
                                        end = 16.dp,
                                        bottom = 8.dp
                                    )
                                )
                            }

                            item {
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.surfaceContainerLow
                                    )
                                ) {
                                    Column {
                                        group.sensors.forEachIndexed { index, sensor ->
                                            SensorListItem(
                                                sensor = sensor,
                                                onClick = {
                                                    backStack.add(
                                                        NavDestinations.SensorDetailScreen(sensor.id)
                                                    )
                                                }
                                            )

                                            if (index < group.sensors.lastIndex) {
                                                HorizontalDivider(
                                                    color = MaterialTheme.colorScheme.outlineVariant
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        item { Spacer(modifier = Modifier.height(16.dp)) }
                    }
                }
            }
        }
    }
}

@Composable
private fun SensorListItem(sensor: Sensor, onClick: () -> Unit) {
    val reading = sensor.lastReading
    val valueText = reading?.value?.toString() ?: "-"
    val status = reading?.status
    val statusColor = when (status) {
        "OK" -> MaterialTheme.colorScheme.primary
        "ERROR" -> MaterialTheme.colorScheme.error
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            painter = painterResource(sensor.type.drawableResource),
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurface,
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = sensor.name,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = sensor.type.name,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Text(
            text = "$valueText ${sensor.unit}",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(end = 10.dp)
        )

        Text(
            text = status ?: "-",
            style = MaterialTheme.typography.labelMedium,
            color = statusColor
        )

        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = ">",
            color = MaterialTheme.colorScheme.outline
        )
    }
}
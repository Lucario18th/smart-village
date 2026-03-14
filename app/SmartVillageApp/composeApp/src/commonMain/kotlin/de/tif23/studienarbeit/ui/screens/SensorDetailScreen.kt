package de.tif23.studienarbeit.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import de.tif23.studienarbeit.viewmodel.SensorDetailsViewModel
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

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Sensor-Details") },
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            val sensorData = state.sensorData

            if (sensorData == null) {
                // Ladezustand – noch keine Daten vom MQTT-Broker
                CircularProgressIndicator()
                Spacer(modifier = Modifier.height(16.dp))
                Text("Warte auf Sensordaten…")
            } else {
                // Daten darstellen
                Text(
                    text = sensorData.sensorName,
                    style = MaterialTheme.typography.headlineMedium
                )
                Spacer(modifier = Modifier.height(16.dp))

                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Aktueller Wert",
                            style = MaterialTheme.typography.labelMedium
                        )
                        Text(
                            text = "${sensorData.value} ${sensorData.unit}",
                            style = MaterialTheme.typography.displaySmall
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        DetailRow("Sensor-ID", sensorData.sensorId.toString())
                        DetailRow("Status", sensorData.status)
                        DetailRow("Zeitstempel", sensorData.timestamp)
                    }
                }
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
        Text(text = label, style = MaterialTheme.typography.bodyMedium)
        Text(text = value, style = MaterialTheme.typography.bodyMedium)
    }
}


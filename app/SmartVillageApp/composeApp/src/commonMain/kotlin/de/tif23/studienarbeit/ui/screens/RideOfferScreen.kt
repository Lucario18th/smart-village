package de.tif23.studienarbeit.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
fun RideOfferScreen(backStack: NavBackStack<NavKey>) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Fahrt anbieten") }
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
                OutlinedTextField(
                    value = "Gengenbach, Hauptstrasse",
                    onValueChange = { },
                    readOnly = true,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Startort") }
                )
            }
            item {
                OutlinedTextField(
                    value = "Freiburg Hbf",
                    onValueChange = { },
                    readOnly = true,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Zielort") }
                )
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = "15.07.2026",
                        onValueChange = { },
                        readOnly = true,
                        modifier = Modifier.weight(1f),
                        label = { Text("Datum") }
                    )
                    OutlinedTextField(
                        value = "10:00",
                        onValueChange = { },
                        readOnly = true,
                        modifier = Modifier.weight(1f),
                        label = { Text("Uhrzeit") }
                    )
                }
            }
            item {
                Text("Freie Plaetze: 3", style = MaterialTheme.typography.titleMedium)
            }
            item {
                OutlinedTextField(
                    value = "Kann in Haslach halten.",
                    onValueChange = { },
                    readOnly = true,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Hinweis (optional)") }
                )
            }
            item {
                Text("Wiederholung", style = MaterialTheme.typography.titleMedium)
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = true, onClick = { }, label = { Text("Einmalig") })
                    FilterChip(selected = false, onClick = { }, label = { Text("Taeglich") })
                    FilterChip(selected = false, onClick = { }, label = { Text("Woechentlich") })
                }
            }
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = { },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Fahrt veroeffentlichen")
                }
            }
        }
    }
}

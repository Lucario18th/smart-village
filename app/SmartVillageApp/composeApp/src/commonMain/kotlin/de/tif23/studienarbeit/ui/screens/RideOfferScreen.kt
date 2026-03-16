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
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import org.jetbrains.compose.resources.painterResource
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.settings
import smartvillageapp.composeapp.generated.resources.transportation

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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        painter = painterResource(Res.drawable.transportation),
                        contentDescription = "Fahrt",
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Strecke",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                painter = painterResource(Res.drawable.settings),
                                contentDescription = "Startort",
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Startort", fontWeight = FontWeight.SemiBold)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = "Gengenbach, Hauptstrasse",
                            onValueChange = { },
                            readOnly = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                painter = painterResource(Res.drawable.settings),
                                contentDescription = "Zielort",
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Zielort", fontWeight = FontWeight.SemiBold)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = "Freiburg Hbf",
                            onValueChange = { },
                            readOnly = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
            item {
                HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
            }
            item {
                Text(
                    "Zeit",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
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
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("Freie Plaetze", fontWeight = FontWeight.SemiBold)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("3", style = MaterialTheme.typography.headlineSmall)
                    }
                }
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
                HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
            }
            item {
                Text(
                    "Wiederholung",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
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

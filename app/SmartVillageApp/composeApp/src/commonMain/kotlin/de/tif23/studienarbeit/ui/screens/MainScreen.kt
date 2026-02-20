package de.tif23.studienarbeit.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.jetbrains.compose.resources.painterResource
import smartvillageapp.composeapp.generated.resources.Res

@Composable
fun MainScreen() {
    Scaffold(
        topBar = {
            Text("Hallo Lörrach!")
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .padding(paddingValues)
        ) {
            item {
                Text("Aktuelle Sensordaten:")
            }
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .clickable { /* TODO: Navigate to details */ },
                    verticalAlignment = Alignment.CenterVertically
                ) {
//                    Icon(
//                        painter = painterResource(Res.drawable.ic_temperature),
//                        contentDescription = "Temperatur",
//                        tint = MaterialTheme.colorScheme.primary,
//                        modifier = Modifier.size(40.dp)
//                    )
                    Column(
                        modifier = Modifier.padding(start = 16.dp)
                    ) {
                        Text("Temperatur: 22°C")
                        Text("Luftfeuchtigkeit: 60%")
                    }
                }
            }
        }
    }
}
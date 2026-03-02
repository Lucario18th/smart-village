package de.tif23.studienarbeit.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import de.tif23.studienarbeit.viewmodel.MainViewModel
import de.tif23.studienarbeit.viewmodel.NavDestinations
import org.jetbrains.compose.resources.painterResource
import ovh.plrapps.mapcompose.ui.MapUI
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.account_circle
import smartvillageapp.composeapp.generated.resources.background_dark
import smartvillageapp.composeapp.generated.resources.background_light
import smartvillageapp.composeapp.generated.resources.commute
import smartvillageapp.composeapp.generated.resources.home
import smartvillageapp.composeapp.generated.resources.logo
import smartvillageapp.composeapp.generated.resources.notifications
import smartvillageapp.composeapp.generated.resources.pinboard
import smartvillageapp.composeapp.generated.resources.settings
import smartvillageapp.composeapp.generated.resources.thermometer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(backStack: NavBackStack<NavKey>, viewModel: MainViewModel = viewModel()) {
    val notifications = listOf(
        "Baustelle B317",
        "Wochenmarkt"
    )
    val notificationTimes = listOf("heute", "Sa")
    val sensors = listOf(
        SensorCardData("22 C", "Temperatur"),
        SensorCardData("60 %", "Luftfeuchtigkeit"),
        SensorCardData("42 dB", "Lärm")
    )
    val backgroundPainter = painterResource(
        if (isSystemInDarkTheme()) Res.drawable.background_dark else Res.drawable.background_light
    )

    Box(modifier = Modifier.fillMaxWidth()) {
        Image(
            painter = backgroundPainter,
            contentDescription = null,
            modifier = Modifier.matchParentSize(),
            contentScale = ContentScale.Crop
        )

        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopBar()
            },
            bottomBar = {
                NavBar(backStack)
            }
        ) { paddingValues ->

            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(paddingValues)
            ) {
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(360.dp)
                                .background(
                                    color = MaterialTheme.colorScheme.surfaceVariant,
                                    shape = RectangleShape
                                )
                        ) {
                            MapUI(state = viewModel.mapState)
                        }
                    }
                }
                item {
                    Text(
                        text = "Neuigkeiten",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(start = 16.dp, top = 4.dp, bottom = 8.dp)
                    )
                }
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                    ) {
                        Column {
                            notifications.forEachIndexed { index, title ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { }
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(text = title)
                                    Text(
                                        text = notificationTimes.getOrElse(index) { "" },
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                                if (index < notifications.lastIndex) {
                                    HorizontalDivider()
                                }
                            }
                        }
                    }
                }
                item {
                    Text(
                        text = "Umweltdaten",
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(start = 16.dp, top = 16.dp, bottom = 8.dp)
                    )
                }
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 16.dp, end = 16.dp, bottom = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        sensors.forEach { sensor ->
                            Card(
                                modifier = Modifier
                                    .weight(1f)
                                    .height(92.dp)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(8.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center
                                ) {
                                    Text(text = sensor.value, style = MaterialTheme.typography.titleLarge)
                                    Spacer(modifier = Modifier.size(16.dp))
                                    Text(text = sensor.label, style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NavBar(backStack: NavBackStack<NavKey>) {
    NavigationBar {
        NavigationBarItem(
            selected = true,
            onClick = {  },
            icon = { Icon(painterResource(Res.drawable.home), contentDescription = "Home") },
        )
        NavigationBarItem(
            selected = false,
            onClick = { backStack.add(NavDestinations.MobilityScreen) },
            icon = { Icon(painterResource(Res.drawable.commute), contentDescription = "Karte") },
        )
        NavigationBarItem(
            selected = false,
            onClick = { },
            icon = {
                Icon(
                    painterResource(Res.drawable.thermometer),
                    contentDescription = "Sensoren"
                )
            },
        )
        NavigationBarItem(
            selected = false,
            onClick = { },
            icon = {
                Icon(
                    painterResource(Res.drawable.pinboard),
                    contentDescription = "Pinboard"
                )
            },
        )
        NavigationBarItem(
            selected = false,
            onClick = { },
            icon = {
                Icon(
                    painterResource(Res.drawable.settings),
                    contentDescription = "Einstellungen"
                )
            },
        )
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun TopBar() {
    TopAppBar(
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Image(
                    painter = painterResource(Res.drawable.logo),
                    contentDescription = null
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Smart Village")
            }
        },
        actions = {
            Icon(
                painter = painterResource(Res.drawable.notifications),
                contentDescription = "Benachrichtigungen",
                modifier = Modifier.padding(end = 12.dp)
            )
            Icon(
                painter = painterResource(Res.drawable.account_circle),
                contentDescription = "Profil",
                modifier = Modifier.padding(end = 8.dp)
            )
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color.Transparent,
            scrolledContainerColor = Color.Transparent
        )
    )
}

private data class SensorCardData(
    val value: String,
    val label: String
)


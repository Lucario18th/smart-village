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
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.overscroll
import androidx.compose.foundation.rememberOverscrollEffect
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Velocity
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import de.tif23.studienarbeit.ui.components.MapButton
import de.tif23.studienarbeit.ui.components.NavBar
import de.tif23.studienarbeit.ui.components.RequestLocationPermission
import de.tif23.studienarbeit.ui.theme.onSurfaceLight
import de.tif23.studienarbeit.util.NavBarTabs
import de.tif23.studienarbeit.util.getPlatform
import de.tif23.studienarbeit.viewmodel.MainViewModel
import de.tif23.studienarbeit.viewmodel.NavDestinations
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import org.jetbrains.compose.resources.painterResource
import ovh.plrapps.mapcompose.ui.MapUI
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.account_circle
import smartvillageapp.composeapp.generated.resources.background_dark
import smartvillageapp.composeapp.generated.resources.background_light
import smartvillageapp.composeapp.generated.resources.city
import smartvillageapp.composeapp.generated.resources.logo
import smartvillageapp.composeapp.generated.resources.my_location
import smartvillageapp.composeapp.generated.resources.notifications
import smartvillageapp.composeapp.generated.resources.open_in_full
import smartvillageapp.composeapp.generated.resources.priority_high
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

@OptIn(ExperimentalMaterial3Api::class, ExperimentalTime::class)
@Composable
fun MainScreen(backStack: NavBackStack<NavKey>, viewModel: MainViewModel = viewModel()) {
    val state by viewModel.viewState.collectAsState()
    val overscrollEffect = rememberOverscrollEffect()
    val refreshThresholdPx = 140f
    var pullDistance by remember { mutableFloatStateOf(0f) }
    var refreshTriggered by remember { mutableStateOf(false) }

    val sensors = listOf(
        SensorCardData(state.environmentalData.temperature, "Temperatur"),
        SensorCardData(state.environmentalData.humidity, "Luftfeuchtigkeit"),
        SensorCardData(state.environmentalData.windSpeed, "Windgeschwindigkeit")
    )
    val hasMapContent = state.village?.village?.features?.map == true
    val hasStatusOrInfo =
        state.village?.statusText?.isNotBlank() == true || state.village?.infoText?.isNotBlank() == true
    val hasMessages = state.messages.isNotEmpty()
    val hasWeatherContent = state.village?.village?.features?.weather == true
    val hasAnyMainContent = hasMapContent || hasStatusOrInfo || hasMessages || hasWeatherContent

    val backgroundPainter = painterResource(
        if (isSystemInDarkTheme()) Res.drawable.background_dark else Res.drawable.background_light
    )

    if (getPlatform().name == "Android") {
        RequestLocationPermission {
            viewModel.startLocationTracking()
        }
    } else if (getPlatform().name == "Ios") {
        viewModel.startLocationTracking()
    }

    LaunchedEffect(Unit) {
        viewModel.loadData()
    }

    LaunchedEffect(state.isLoading) {
        if (!state.isLoading) {
            pullDistance = 0f
            refreshTriggered = false
        }
    }

    val refreshOnOverscroll = remember(state.isLoading) {
        object : NestedScrollConnection {
            override fun onPostScroll(
                consumed: Offset,
                available: Offset,
                source: NestedScrollSource
            ): Offset {
                if (source == NestedScrollSource.UserInput) {
                    if (available.y > 0f && consumed.y == 0f) {
                        pullDistance += available.y
                        if (!refreshTriggered && !state.isLoading && pullDistance >= refreshThresholdPx) {
                            refreshTriggered = true
                            viewModel.loadData()
                        }
                    } else if (available.y < 0f) {
                        pullDistance = 0f
                    }
                }
                return Offset.Zero
            }

            override suspend fun onPostFling(consumed: Velocity, available: Velocity): Velocity {
                pullDistance = 0f
                refreshTriggered = false
                return Velocity.Zero
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .nestedScroll(refreshOnOverscroll)
            .overscroll(overscrollEffect)
    ) {
        Image(
            painter = backgroundPainter,
            contentDescription = null,
            modifier = Modifier.matchParentSize(),
            contentScale = ContentScale.Crop
        )

        if (state.isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.Center),
                color = MaterialTheme.colorScheme.primary
            )
        } else if (state.village == null && !state.isLoading) {
            Text(
                text = "Das Dorf mit der ID ... konnte nicht geladen werden \n Bitte löschen Sie den Speicherinhalt der App und starten Sie die App erneut",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .align(Alignment.Center)
                    .padding(24.dp)
            )
        } else if (state.village == null) {
            Text(
                text = "Das Dorf mit der ID ... konnte nicht geladen werden \n Bitte löschen Sie den Speicherinhalt der App und starten Sie die App erneut",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .align(Alignment.Center)
                    .padding(24.dp)
            )
        } else {
            Scaffold(
                containerColor = Color.Transparent,
                topBar = {
                    TopBar(
                        backStack = backStack,
                        villageId = state.village?.village?.id!!,
                        villageName = state.village?.village?.name!!,
                        isMessageFeatureActive = state.village?.village?.features?.messages?: false
                    )
                },
                bottomBar = {
                    NavBar(backStack, NavBarTabs.MAIN)
                }
            ) { paddingValues ->

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize(),
                    contentPadding = paddingValues
                ) {
                    if (hasMapContent) {
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
                                    Column(
                                        modifier = Modifier.align(Alignment.TopEnd)
                                    ) {
                                        MapButton(
                                            icon = Res.drawable.open_in_full,
                                            contentDescription = "Vollbildkarte",
                                            onClick = {
                                                backStack.add(NavDestinations.MapScreen)
                                            }
                                        )
                                        MapButton(
                                            icon = Res.drawable.my_location,
                                            contentDescription = "Auf mich zentrieren",
                                            onClick = {
                                                viewModel.centerOnUser()
                                            }
                                        )
                                        MapButton(
                                            icon = Res.drawable.city,
                                            contentDescription = "Auf Dorf zentrieren",
                                            onClick = {
                                                viewModel.centerOnVillage()
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                    if (hasStatusOrInfo) {
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.primaryContainer
                                )
                            ) {
                                Column(
                                    modifier = Modifier.padding(
                                        horizontal = 16.dp,
                                        vertical = 12.dp
                                    ),
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = state.village?.statusText ?: "Status",
                                        style = MaterialTheme.typography.titleSmall,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = state.village?.infoText ?: "",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }
                        }
                    }
                    if (hasMessages) {
                        item {
                            Text(
                                text = "Neuigkeiten",
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.padding(
                                    start = 16.dp,
                                    top = 12.dp,
                                    bottom = 8.dp
                                )
                            )
                        }
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp)
                            ) {
                                Column {
                                    state.messages.forEachIndexed { index, message ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clickable { }
                                                .padding(12.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            if (message.priority == "hoch") {
                                                Icon(
                                                    painter = painterResource(Res.drawable.priority_high),
                                                    contentDescription = null,
                                                    tint = MaterialTheme.colorScheme.error
                                                )
                                            }
                                            Text(text = message.text)
                                            Text(
                                                text = if (message.createdAt.date == Clock.System.now()
                                                        .toLocalDateTime(TimeZone.currentSystemDefault()).date
                                                ) {
                                                    "${message.createdAt.hour}:${message.createdAt.minute}"
                                                } else {
                                                    "${message.createdAt.day}.${message.createdAt.month}"
                                                },
                                                style = MaterialTheme.typography.bodySmall
                                            )
                                        }
                                        if (index < state.messages.lastIndex) {
                                            HorizontalDivider()
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (hasWeatherContent) {
                        item {
                            Text(
                                text = "Umweltdaten",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.padding(
                                    start = 16.dp,
                                    top = 16.dp,
                                    bottom = 8.dp
                                )
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
                                            Text(
                                                text = sensor.value,
                                                style = MaterialTheme.typography.titleLarge
                                            )
                                            Spacer(modifier = Modifier.size(16.dp))
                                            Text(
                                                text = sensor.label,
                                                style = MaterialTheme.typography.bodySmall
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (!hasAnyMainContent) {
                        item {
                            Spacer(modifier = Modifier.fillParentMaxSize())
                        }
                    }
                }
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun TopBar(backStack: NavBackStack<NavKey>, villageId: Int, villageName: String, isMessageFeatureActive: Boolean) {
    TopAppBar(
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Image(
                    painter = painterResource(Res.drawable.logo),
                    contentDescription = null
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = villageName,
                    style = MaterialTheme.typography.titleLarge,
                    color = onSurfaceLight
                )
            }
        },
        actions = {
            if (isMessageFeatureActive) {
                IconButton(onClick = { backStack.add(NavDestinations.MessagesScreen(villageId)) }) {
                    Icon(
                        painter = painterResource(Res.drawable.notifications),
                        contentDescription = "Benachrichtigungen",
                        modifier = Modifier.padding(end = 12.dp)
                    )
                }
            }
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


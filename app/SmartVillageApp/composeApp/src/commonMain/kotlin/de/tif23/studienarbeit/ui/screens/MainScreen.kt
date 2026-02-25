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
import androidx.compose.material3.TopAppBarColors
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.input.key.Key.Companion.Symbol
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.painterResource
import org.maplibre.compose.camera.CameraPosition
import org.maplibre.compose.camera.rememberCameraState
import org.maplibre.compose.expressions.dsl.coalesce
import org.maplibre.compose.expressions.dsl.const
import org.maplibre.compose.expressions.dsl.image
import org.maplibre.compose.layers.CircleLayer
import org.maplibre.compose.layers.SymbolLayer
import org.maplibre.compose.map.MapOptions
import org.maplibre.compose.map.MaplibreMap
import org.maplibre.compose.map.OrnamentOptions
import org.maplibre.compose.material3.CompassButton
import org.maplibre.compose.sources.GeoJsonData
import org.maplibre.compose.sources.GeoJsonOptions
import org.maplibre.compose.sources.GeoJsonSource
import org.maplibre.compose.sources.getBaseSource
import org.maplibre.compose.sources.rememberGeoJsonSource
import org.maplibre.compose.style.BaseStyle
import org.maplibre.compose.style.rememberStyleState
import org.maplibre.spatialk.geojson.Position
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.account_circle
import smartvillageapp.composeapp.generated.resources.background_dark
import smartvillageapp.composeapp.generated.resources.background_light
import smartvillageapp.composeapp.generated.resources.home
import smartvillageapp.composeapp.generated.resources.map
import smartvillageapp.composeapp.generated.resources.notifications
import smartvillageapp.composeapp.generated.resources.pinboard
import smartvillageapp.composeapp.generated.resources.settings
import smartvillageapp.composeapp.generated.resources.thermometer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen() {
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
                TopAppBar(
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .background(
                                        color = MaterialTheme.colorScheme.primaryContainer,
                                        shape = RoundedCornerShape(6.dp)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "LOGO",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
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
            },
            bottomBar = {
                NavigationBar {
                    NavigationBarItem(
                        selected = true,
                        onClick = { },
                        icon = { Icon(painterResource(Res.drawable.home), contentDescription = "Home") },
                    )
                    NavigationBarItem(
                        selected = false,
                        onClick = { },
                        icon = { Icon(painterResource(Res.drawable.map), contentDescription = "Karte") },
                    )
                    NavigationBarItem(
                        selected = false,
                        onClick = { },
                        icon = { Icon(painterResource(Res.drawable.thermometer), contentDescription = "Sensoren") },
                    )
                    NavigationBarItem(
                        selected = false,
                        onClick = { },
                        icon = { Icon(painterResource(Res.drawable.pinboard), contentDescription = "Pinboard") },
                    )
                    NavigationBarItem(
                        selected = false,
                        onClick = { },
                        icon = { Icon(painterResource(Res.drawable.settings), contentDescription = "Einstellungen") },
                    )
                }
            }
        ) { paddingValues ->

            val cameraState = rememberCameraState(
                firstPosition = CameraPosition(
                    target = Position(latitude = 47.61379, longitude = 7.66707),
                    zoom = 14.0
                )
            )
            val styleState = rememberStyleState()
            val coroutineScope = rememberCoroutineScope()

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
                            MaplibreMap(
                                baseStyle = BaseStyle.Uri("https://tiles.openfreemap.org/styles/bright"),
                                cameraState = cameraState,
                                styleState = styleState,
                                options = MapOptions(ornamentOptions = OrnamentOptions.AllDisabled),
                            ) {
                                coroutineScope.launch {
                                    val poiData =
                                        Res.readBytes("files/pois.geojson").decodeToString()
                                }
                                val pois = rememberGeoJsonSource(
                                    data = GeoJsonData.JsonString(getPois()),
                                )

                                SymbolLayer(
                                    id = "containers",
                                    source = pois,
                                    iconColor = const(Color.Blue),
                                    iconImage = coalesce(
                                        image("marker-15"),
                                        image("marker"),        // optionaler alternativer Name
                                        image("default-marker") // letzter Fallback, muss im Sprite existieren
                                    )
                                )
                            }
                            Box(modifier = Modifier.fillMaxSize().padding(8.dp)) {
                                CompassButton(cameraState, modifier = Modifier.align(Alignment.TopEnd))
                            }
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

private data class SensorCardData(
    val value: String,
    val label: String
)

private fun getPois(): String {
    return """
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "type": "AltglasContainer", "name": "Altglas 1" },
      "geometry": { "type": "Point", "coordinates": [7.6588259, 47.6158539] }
    },
    {
      "type": "Feature",
      "properties": { "type": "AltglasContainer", "name": "Altglas 2" },
      "geometry": { "type": "Point", "coordinates": [7.6625086, 47.6020404] }
    },
    {
      "type": "Feature",
      "properties": { "type": "AltglasContainer", "name": "Altglas 3" },
      "geometry": { "type": "Point", "coordinates": [7.6656273, 47.6060166] }
    },
    {
      "type": "Feature",
      "properties": { "type": "AltglasContainer", "name": "Altglas 4" },
      "geometry": { "type": "Point", "coordinates": [7.6821256, 47.6046121] }
    },
    {
      "type": "Feature",
      "properties": { "type": "AltglasContainer", "name": "Altglas 5" },
      "geometry": { "type": "Point", "coordinates": [7.6575314, 47.6257573] }
    },
    {
      "type": "Feature",
      "properties": { "type": "AltglasContainer", "name": "Altglas 6" },
      "geometry": { "type": "Point", "coordinates": [7.6576323, 47.6074133] }
    },
    {
      "type": "Feature",
      "properties": { "type": "Altkleidercontainer", "name": "Altkleider 1" },
      "geometry": { "type": "Point", "coordinates": [7.6593509, 47.6169543] }
    },
    {
      "type": "Feature",
      "properties": { "type": "Altkleidercontainer", "name": "Altkleider 2" },
      "geometry": { "type": "Point", "coordinates": [7.6574422, 47.6030977] }
    }
  ]
}
    """.trimIndent()
}


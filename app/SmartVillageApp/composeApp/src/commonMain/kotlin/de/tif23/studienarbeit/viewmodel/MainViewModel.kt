package de.tif23.studienarbeit.viewmodel

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetMessagesUseCase
import de.tif23.studienarbeit.model.usecase.GetSensorDataUseCase
import de.tif23.studienarbeit.model.usecase.GetVillageTrainStationsUseCase
import de.tif23.studienarbeit.model.usecase.GetVillageUseCase
import de.tif23.studienarbeit.provider.LocationService
import de.tif23.studienarbeit.provider.createLocationService
import de.tif23.studienarbeit.provider.makeOsmTileStreamProvider
import de.tif23.studienarbeit.ui.theme.backgroundLight
import de.tif23.studienarbeit.ui.theme.onSurfaceLight
import de.tif23.studienarbeit.ui.theme.primaryLight
import de.tif23.studienarbeit.util.latToY
import de.tif23.studienarbeit.util.lonToX
import de.tif23.studienarbeit.viewmodel.constants.BUGGINGEN_LAT
import de.tif23.studienarbeit.viewmodel.constants.BUGGINGEN_LON
import de.tif23.studienarbeit.viewmodel.constants.FREIBURG_LAT
import de.tif23.studienarbeit.viewmodel.constants.FREIBURG_LON
import de.tif23.studienarbeit.viewmodel.constants.LOERRACH_LAT
import de.tif23.studienarbeit.viewmodel.constants.LOERRACH_LON
import de.tif23.studienarbeit.viewmodel.data.Sensor
import de.tif23.studienarbeit.viewmodel.data.SensorType
import de.tif23.studienarbeit.viewmodel.data.VillageConfig
import de.tif23.studienarbeit.viewmodel.data.state.EnvironmentalData
import de.tif23.studienarbeit.viewmodel.data.state.MainViewModelState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.painterResource
import ovh.plrapps.mapcompose.api.addCallout
import ovh.plrapps.mapcompose.api.addLayer
import ovh.plrapps.mapcompose.api.addMarker
import ovh.plrapps.mapcompose.api.centerOnMarker
import ovh.plrapps.mapcompose.api.onMarkerClick
import ovh.plrapps.mapcompose.api.scale
import ovh.plrapps.mapcompose.ui.layout.Forced
import ovh.plrapps.mapcompose.ui.state.MapState
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.circle_full
import smartvillageapp.composeapp.generated.resources.train_filled
import kotlin.math.pow
import kotlin.math.roundToInt

class MainViewModel(
    private val getVillageUseCase: GetVillageUseCase = GetVillageUseCase(),
    private val selectedVillageSettingsStore: SelectedVillageSettingsStore = SelectedVillageSettingsStore(),
    private val getMessagesUseCase: GetMessagesUseCase = GetMessagesUseCase(),
    private val getSensorDataUseCase: GetSensorDataUseCase = GetSensorDataUseCase(),
    private val getVillageTrainStationsUseCase: GetVillageTrainStationsUseCase = GetVillageTrainStationsUseCase()
) : ViewModel() {

    private val locationService: LocationService = createLocationService()
    private val tileStreamProvider = makeOsmTileStreamProvider()
    private val maxLevel = 16
    private val minLevel = 12
    private val mapSize = mapSizeAtLevel(maxLevel, tileSize = 256)

    private val stateFlow = MutableStateFlow(MainViewModelState())

    val viewState = stateFlow.asStateFlow()

    val mapState = MapState(levelCount = maxLevel + 1, mapSize, mapSize, workerCount = 16) {
        minimumScaleMode(Forced(1 / 2.0.pow(maxLevel - minLevel)))
        scroll(lonToX(LOERRACH_LON), latToY(LOERRACH_LAT))
    }.apply {
        addLayer(tileStreamProvider)
        scale = 1.0 // to zoom out initially
        addMarker(
            id = "init_loerrach",
            x = lonToX(LOERRACH_LON),
            y = latToY(LOERRACH_LAT)
        ) {}
        addMarker(
            id = "init_freiburg",
            x = lonToX(FREIBURG_LON),
            y = latToY(FREIBURG_LAT)
        ) {}
        addMarker(
            id = "init_buggingen",
            x = lonToX(BUGGINGEN_LON),
            y = latToY(BUGGINGEN_LAT)
        ) {}
    }

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            stateFlow.update { it.copy(isLoading = true) }
            val villageId = selectedVillageSettingsStore.getSelectedVillageId()
            if (villageId == null || villageId == -1) {
                stateFlow.update { it.copy(isLoading = false, village = null) }
            } else {
                val village = getVillageUseCase.getVillageConfig(villageId)
                stateFlow.update { it.copy(village = village, isLoading = false) }
                moveToInitialPosition(village)
                loadMarkers(village)
                addClickListeners(village)
                loadEnvironmentalData(villageId)
                viewModelScope.launch {
                    val messages = getMessagesUseCase.getInitialMessages(villageId)
                    stateFlow.update { it.copy(messages = messages) }
                }
            }
        }
    }

    fun startLocationTracking() {
        viewModelScope.launch {
            locationService.locationFlow.collect { location ->
                // Update User Position Marker
                mapState.addMarker(
                    id = "user_location",
                    x = lonToX(location.lon),
                    y = latToY(location.lat)
                ) {
                    // UI für den Standort (blauer Punkt)
                    Icon(
                        painter = painterResource(Res.drawable.circle_full), // Oder eigenes Icon
                        contentDescription = "Ihr Standort",
                        modifier = Modifier.size(24.dp),
                        tint = onSurfaceLight
                    )
                }

                // Optional: Karte zentrieren beim ersten Fix
                // mapState.centerOnMarker("user_location", 1.0f)
            }
        }
    }

    private suspend fun addClickListeners(village: VillageConfig) {
        val stations = getVillageTrainStationsUseCase.getAllStationsForVillage(village.village.name)
        mapState.apply {
            onMarkerClick { id, x, y ->
                addCallout(
                    id, x, y,
                    absoluteOffset = DpOffset(0.dp, (-40).dp),
                    autoDismiss = true

                ) {
                    if (id.startsWith("container_")) {
                        MarkerCalloutCard("Container")
                    } else if (id.startsWith("station_")) {
                        val stationName =
                            stations.find { it.eva.toString() == id.removePrefix("station_") }?.name
                                ?: ""
                        MarkerCalloutCard("Bahnhof: $stationName")
                    } else if (id.startsWith("sensor_")) {
                        val sensorName = village.sensors.find {
                            it.id == id.removePrefix("sensor_").toInt()
                        }?.name ?: ""
                        MarkerCalloutCard(sensorName)
                    }
                }
            }

        }
    }

    private fun loadEnvironmentalData(villageId: Int) {
        viewModelScope.launch {
            val sensors = runCatching {
                getSensorDataUseCase.getInitialSensorData(villageId)
            }.getOrDefault(emptyList())

            stateFlow.update {
                it.copy(environmentalData = buildEnvironmentalData(sensors))
            }
        }
    }

    private fun moveToInitialPosition(village: VillageConfig) {
        viewModelScope.launch {
            mapState.centerOnMarker(
                id = when (village.village.name) {
                    "Freiburg im Breisgau" -> "init_freiburg"
                    "Buggingen" -> "init_buggingen"
                    "Lörrach" -> "init_loerrach"
                    else -> "init_loerrach"
                },
                destScale = 1.0,
                destAngle = 0f
            )
        }
    }

    private fun mapSizeAtLevel(wmtsLevel: Int, tileSize: Int): Int {
        return tileSize * 2.0.pow(wmtsLevel).toInt()
    }

    private fun buildEnvironmentalData(sensors: List<Sensor>): EnvironmentalData {
        val temperature = sensors.averageForCategory(SensorType.TEMPERATURE)
        val humidity = sensors.averageForCategory(SensorType.AIR_HUMIDITY)
        val windSpeed = sensors.averageForCategory(SensorType.WIND_SPEED)

        return EnvironmentalData(
            temperature = temperature?.let { formatAverage(it, "C") } ?: "-",
            humidity = humidity?.let { formatAverage(it, "%") } ?: "-",
            windSpeed = windSpeed?.let { formatAverage(it, "m/s") } ?: "-"
        )
    }

    private fun List<Sensor>.averageForCategory(sensorType: SensorType): Double? {
        val values = this
            .asSequence()
            .filter { it.type == sensorType }
            .mapNotNull { it.lastReading?.value }
            .toList()

        if (values.isEmpty()) {
            return null
        }

        return values.average()
    }

    private fun formatAverage(value: Double, unit: String): String {
        val rounded = (value * 10).roundToInt() / 10.0
        val displayValue = if (rounded % 1.0 == 0.0) {
            rounded.toInt().toString()
        } else {
            rounded.toString()
        }
        return "$displayValue $unit"
    }

    private fun loadMarkers(village: VillageConfig) {
        viewModelScope.launch {
//            if (village.village.features?.textileContainers!!) {
//                val container = Res.readBytes("files/container.json").decodeToString()
//                val containerList = JsonArray(Json.parseToJsonElement(container).jsonArray).map {
//                    Json.decodeFromJsonElement<RecyclingContainer>(it)
//                }
//                containerList.forEach {
//                    mapState.addMarker(
//                        id = "container_${it.id}",
//                        x = lonToX(it.coordinates.lon),
//                        y = latToY(it.coordinates.lat)
//                    ) {
//                        Icon(
//                            painter = if (it.type == RecyclingType.ALTGLAS.name) painterResource(Res.drawable.altglas_location) else painterResource(
//                                Res.drawable.altkleider_location
//                            ),
//                            contentDescription = null,
//                            modifier = Modifier.size(32.dp),
//                            tint = onSurfaceLight
//                        )
//                    }
//                }
//            }

            val villageStations = getVillageTrainStationsUseCase.getAllStationsForVillage(
                stateFlow.value.village?.village?.name ?: ""
            )

            villageStations.forEach {
                mapState.addMarker(
                    id = "station_${it.eva}",
                    x = lonToX(it.lon),
                    y = latToY(it.lat)
                ) {
                    Icon(
                        painter = painterResource(Res.drawable.train_filled),
                        contentDescription = null,
                        modifier = Modifier.size(24.dp),
                        tint = onSurfaceLight
                    )
                }
            }

            if (village.village.features?.sensorData ?: false) {
                val sensors = stateFlow.value.village?.sensors!!
                sensors.forEach {
                    if (it.coordinates != null) {
                        mapState.addMarker(
                            id = "sensor_${it.id}",
                            x = lonToX(it.coordinates.lon),
                            y = latToY(it.coordinates.lat)
                        ) {
                            Icon(
                                painter = painterResource(it.type.drawableResource),
                                contentDescription = null,
                                modifier = Modifier.size(if (it.type == SensorType.RIDESHARE) 32.dp else 24.dp),
                                tint = onSurfaceLight
                            )
                        }
                    }
                }
            }
        }
    }

    fun centerOnUser() {
        viewModelScope.launch {
            mapState.centerOnMarker("user_location", destScale = 1.0)
        }
    }

    fun centerOnVillage() {
        viewModelScope.launch {
            mapState.centerOnMarker(
                id = when (stateFlow.value.village?.village?.name) {
                    "Freiburg im Breisgau" -> "init_freiburg"
                    "Buggingen" -> "init_buggingen"
                    "Lörrach" -> "init_loerrach"
                    else -> "init_loerrach"
                }, destScale = 1.0
            )
        }
    }

    @Composable
    private fun MarkerCalloutCard(text: String) {
        Card(
            colors = CardDefaults.cardColors(
                containerColor = backgroundLight
            ),
            modifier = Modifier
                .clip(RoundedCornerShape(4.dp))
                .border(1.dp, primaryLight, RoundedCornerShape(8.dp))
        ) {
            Text(
                text = text,
                color = onSurfaceLight,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(8.dp)
            )
        }
    }
}
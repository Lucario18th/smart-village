package de.tif23.studienarbeit.viewmodel

import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetDeparturesUseCase
import de.tif23.studienarbeit.model.usecase.GetVillageTrainStationsUseCase
import de.tif23.studienarbeit.model.usecase.GetVillageUseCase
import de.tif23.studienarbeit.provider.LocationService
import de.tif23.studienarbeit.provider.createLocationService
import de.tif23.studienarbeit.provider.makeOsmTileStreamProvider
import de.tif23.studienarbeit.ui.theme.onSurfaceLight
import de.tif23.studienarbeit.util.latToY
import de.tif23.studienarbeit.util.lonToX
import de.tif23.studienarbeit.viewmodel.constants.BUGGINGEN_LAT
import de.tif23.studienarbeit.viewmodel.constants.BUGGINGEN_LON
import de.tif23.studienarbeit.viewmodel.constants.FREIBURG_LAT
import de.tif23.studienarbeit.viewmodel.constants.FREIBURG_LON
import de.tif23.studienarbeit.viewmodel.constants.LOERRACH_LAT
import de.tif23.studienarbeit.viewmodel.constants.LOERRACH_LON
import de.tif23.studienarbeit.viewmodel.data.RecyclingContainer
import de.tif23.studienarbeit.viewmodel.data.RecyclingType
import de.tif23.studienarbeit.viewmodel.data.Sensor
import de.tif23.studienarbeit.viewmodel.data.TrainStation
import de.tif23.studienarbeit.viewmodel.data.VillageConfig
import de.tif23.studienarbeit.viewmodel.data.state.MapScreenViewModelState
import de.tif23.studienarbeit.viewmodel.data.state.MapSheetContent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonArray
import org.jetbrains.compose.resources.painterResource
import ovh.plrapps.mapcompose.api.addLayer
import ovh.plrapps.mapcompose.api.addMarker
import ovh.plrapps.mapcompose.api.centerOnMarker
import ovh.plrapps.mapcompose.api.onMarkerClick
import ovh.plrapps.mapcompose.api.scale
import ovh.plrapps.mapcompose.ui.layout.Forced
import ovh.plrapps.mapcompose.ui.state.MapState
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.altglas_location
import smartvillageapp.composeapp.generated.resources.altkleider_location
import smartvillageapp.composeapp.generated.resources.circle_full
import smartvillageapp.composeapp.generated.resources.parkbank_location
import smartvillageapp.composeapp.generated.resources.train_filled
import smartvillageapp.composeapp.generated.resources.weather_filled
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

class MapScreenViewModel(
    private val getVillageUseCase: GetVillageUseCase = GetVillageUseCase(),
    private val selectedVillageSettingsStore: SelectedVillageSettingsStore = SelectedVillageSettingsStore(),
    private val getVillageTrainStationsUseCase: GetVillageTrainStationsUseCase = GetVillageTrainStationsUseCase(),
    private val getDeparturesUseCase: GetDeparturesUseCase = GetDeparturesUseCase()
) : ViewModel() {

    private val locationService: LocationService = createLocationService()
    private val tileStreamProvider = makeOsmTileStreamProvider()
    private val maxLevel = 16
    private val minLevel = 12
    private val mapSize = mapSizeAtLevel(maxLevel, tileSize = 256)

    private val stateFlow = MutableStateFlow(MapScreenViewModelState())
    val viewState = stateFlow.asStateFlow()

    val mapState = MapState(levelCount = maxLevel + 1, mapSize, mapSize, workerCount = 16) {
        minimumScaleMode(Forced(1 / 2.0.pow(maxLevel - minLevel)))
        scroll(lonToX(LOERRACH_LON), latToY(LOERRACH_LAT))
    }.apply {
        addLayer(tileStreamProvider)
        scale = 1.0
        addMarker(id = "init_loerrach", x = lonToX(LOERRACH_LON), y = latToY(LOERRACH_LAT)) {}
        addMarker(id = "init_freiburg", x = lonToX(FREIBURG_LON), y = latToY(FREIBURG_LAT)) {}
        addMarker(id = "init_buggingen", x = lonToX(BUGGINGEN_LON), y = latToY(BUGGINGEN_LAT)) {}
    }

    private var stationsByEva: Map<String, TrainStation> = emptyMap()
    private var sensorsById: Map<Int, Sensor> = emptyMap()
    private var containersById: Map<String, RecyclingContainer> = emptyMap()

    init {
        loadVillageAndMap()
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

    fun dismissSheet() {
        stateFlow.update { it.copy(sheetContent = null) }
    }

    private fun loadVillageAndMap() {
        viewModelScope.launch {
            stateFlow.update { it.copy(isLoading = true) }
            val villageId = selectedVillageSettingsStore.getSelectedVillageId()
            if (villageId == null || villageId == -1) {
                stateFlow.update { it.copy(isLoading = false, village = null) }
                return@launch
            }

            val village = getVillageUseCase.getVillageConfig(villageId)
            stateFlow.update { it.copy(village = village, isLoading = false) }
            moveToInitialPosition(village)
            loadMarkers(village)
            addClickListeners()
        }
    }

    private suspend fun loadMarkers(village: VillageConfig) {
        val containers = loadRecyclingContainers()
        val stations = getVillageTrainStationsUseCase.getAllStationsForVillage(village.village.name)
        val sensors = village.sensors

        containersById = containers.associateBy { it.id }
        stationsByEva = stations.associateBy { it.eva.toString() }
        sensorsById = sensors.associateBy { it.id }

        containers.forEach {
            mapState.addMarker(
                id = "container_${it.id}",
                x = lonToX(it.coordinates.lon),
                y = latToY(it.coordinates.lat)
            ) {
                Icon(
                    painter = if (it.type == RecyclingType.ALTGLAS.name) {
                        painterResource(Res.drawable.altglas_location)
                    } else {
                        painterResource(Res.drawable.altkleider_location)
                    },
                    contentDescription = null,
                    modifier = Modifier.size(32.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }

        stations.forEach {
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

        sensors.forEach {
            mapState.addMarker(
                id = "sensor_${it.id}",
                x = lonToX(it.coordinates.lon),
                y = latToY(it.coordinates.lat)
            ) {
                Icon(
                    painter = if (it.type == "Mitfahrbank") {
                        painterResource(Res.drawable.parkbank_location)
                    } else {
                        painterResource(Res.drawable.weather_filled)
                    },
                    contentDescription = null,
                    modifier = Modifier.size(if (it.type == "Mitfahrbank") 32.dp else 24.dp),
                    tint = onSurfaceLight
                )
            }
        }
    }

    private suspend fun loadRecyclingContainers(): List<RecyclingContainer> {
        val rawJson = Res.readBytes("files/container.json").decodeToString()
        return JsonArray(Json.parseToJsonElement(rawJson).jsonArray).map {
            Json.decodeFromJsonElement<RecyclingContainer>(it)
        }
    }

    private fun addClickListeners() {
        mapState.onMarkerClick { id, _, _ ->
            when {
                id.startsWith("station_") -> onStationSelected(id.removePrefix("station_"))
                id.startsWith("sensor_") -> onSensorSelected(id.removePrefix("sensor_"))
                id.startsWith("container_") -> onContainerSelected(id.removePrefix("container_"))
            }
        }
    }

    private fun onContainerSelected(containerId: String) {
        val container = containersById[containerId] ?: return
        val label = if (container.type == RecyclingType.ALTGLAS.name) "Altglas" else "Altkleider"
        stateFlow.update { it.copy(sheetContent = MapSheetContent.Container(label = label)) }
    }

    private fun onSensorSelected(sensorId: String) {
        val sensor = sensorsById[sensorId.toIntOrNull() ?: return] ?: return
        val value = sensor.lastReading?.value?.let { formatNumericValue(it) } ?: "-"
        stateFlow.update {
            it.copy(
                sheetContent = MapSheetContent.Sensor(
                    id = sensor.id,
                    name = sensor.name,
                    type = sensor.type,
                    value = value,
                    unit = sensor.unit,
                    isRideshareBench = sensor.type == "Mitfahrbank"
                )
            )
        }
    }

    private fun onStationSelected(evaNo: String) {
        val stationName = stationsByEva[evaNo]?.name ?: "Bahnhof"
        stateFlow.update {
            it.copy(
                sheetContent = MapSheetContent.Station(
                    evaNo = evaNo,
                    stationName = stationName,
                    isLoading = true
                )
            )
        }

        viewModelScope.launch {
            runCatching {
                val (date, hour) = getCurrentTimetableDateAndHour()
                getDeparturesUseCase(evaNo, date, hour)
                    .sortedBy { it.departure }
                    .take(2)
            }.onSuccess { departures ->
                stateFlow.update { state ->
                    val currentContent = state.sheetContent as? MapSheetContent.Station
                    if (currentContent?.evaNo != evaNo) {
                        return@update state
                    }
                    state.copy(
                        sheetContent = currentContent.copy(
                            departures = departures,
                            isLoading = false,
                            errorMessage = null
                        )
                    )
                }
            }.onFailure { error ->
                stateFlow.update { state ->
                    val currentContent = state.sheetContent as? MapSheetContent.Station
                    if (currentContent?.evaNo != evaNo) {
                        return@update state
                    }
                    state.copy(
                        sheetContent = currentContent.copy(
                            departures = emptyList(),
                            isLoading = false,
                            errorMessage = error.message ?: "Abfahrten konnten nicht geladen werden"
                        )
                    )
                }
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

    private fun formatNumericValue(value: Double): String {
        val rounded = (value * 10).roundToInt() / 10.0
        return if (rounded % 1.0 == 0.0) rounded.toInt().toString() else rounded.toString()
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
}

@OptIn(ExperimentalTime::class)
private fun getCurrentTimetableDateAndHour(): Pair<String, String> {
    val now = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault())
    val isoDate = now.date.toString()
    val date = "${isoDate.substring(2, 4)}${isoDate.substring(5, 7)}${isoDate.substring(8, 10)}"
    val hour = now.hour.toString().padStart(2, '0')
    return date to hour
}




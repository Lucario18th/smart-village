package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetDeparturesUseCase
import de.tif23.studienarbeit.model.usecase.GetRidesharePointUseCase
import de.tif23.studienarbeit.model.usecase.GetSensorDataUseCase
import de.tif23.studienarbeit.model.usecase.GetVillageTrainStationsUseCase
import de.tif23.studienarbeit.model.usecase.GetVillageUseCase
import de.tif23.studienarbeit.viewmodel.data.Coordinates
import de.tif23.studienarbeit.viewmodel.data.SensorType
import de.tif23.studienarbeit.viewmodel.data.Station
import de.tif23.studienarbeit.viewmodel.data.state.MobilityViewModelState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

class MobilityViewModel(
    private val getRidesharePointUseCase: GetRidesharePointUseCase = GetRidesharePointUseCase(),
    private val getSensorDataUseCase: GetSensorDataUseCase = GetSensorDataUseCase(),
    private val getDeparturesUseCase: GetDeparturesUseCase = GetDeparturesUseCase(),
    private val getVillageUseCase: GetVillageUseCase = GetVillageUseCase(),
    private val getVillageTrainStationsUseCase: GetVillageTrainStationsUseCase = GetVillageTrainStationsUseCase(),
    private val selectedVillageSettingsStore: SelectedVillageSettingsStore = SelectedVillageSettingsStore()
) : ViewModel() {
    private val stateFlow = MutableStateFlow(MobilityViewModelState())
    private var ridesharePollingJob: Job? = null

    val viewState = stateFlow.asStateFlow()

    init {
        loadStations()
        loadRidesharePoints()
    }

    fun loadStations() {
        viewModelScope.launch {
            stateFlow.update { it.copy(isLoadingStations = true, stationErrorMessage = null, stations = emptyList()) }

            val villageId = selectedVillageSettingsStore.getSelectedVillageId()
            if (villageId == null || villageId == -1) {
                stateFlow.update {
                    it.copy(isLoadingStations = false, stationErrorMessage = "Kein Dorf ausgewählt.", stations = emptyList())
                }
                return@launch
            }

            runCatching {
                val villageName = getVillageUseCase.getVillageConfig(villageId).village.name
                val stationBaseData = getVillageTrainStationsUseCase.getTopStationsForVillage(villageName, limit = 6)
                val (date, hour) = getCurrentTimetableDateAndHour()

                val stations = mutableListOf<Station>()
                stationBaseData.forEach { station ->
                    val departures = getDeparturesUseCase(station.eva.toString(), date, hour)
                    stations.add(Station(
                        evaNo = station.eva.toString(),
                        name = station.name,
                        distance = "500m",
                        departures = departures,
                        coordinates = Coordinates(station.lat, station.lon)
                    ))
                }
                return@runCatching stations

            }.onSuccess { stations ->
                stateFlow.update {
                    it.copy(
                        isLoadingStations = false,
                        stations = stations
                    )
                }
            }.onFailure { error ->
                stateFlow.update {
                    it.copy(
                        isLoadingStations = false,
                        stationErrorMessage = error.message ?: "Abfahrten konnten nicht geladen werden"
                    )
                }
            }
        }
    }

    fun loadRidesharePoints() {
        if (ridesharePollingJob?.isActive == true) return

        ridesharePollingJob = viewModelScope.launch(Dispatchers.IO) {
            val villageId = selectedVillageSettingsStore.getSelectedVillageId()
            if (villageId == null || villageId == -1) {
                stateFlow.update {
                    it.copy(isLoadingRidesharePoints = false, ridesharePointErrorMessage = "Kein Dorf ausgewählt.")
                }
                return@launch
            }

            while (isActive) {
                refreshRideshareData(villageId)
                delay(POLLING_INTERVAL_MS)
            }
        }
    }

    override fun onCleared() {
        ridesharePollingJob?.cancel()
        super.onCleared()
    }

    private suspend fun refreshRideshareData(villageId: Int) {
        val shouldShowLoadingState = stateFlow.value.ridesharePoints.isEmpty() && stateFlow.value.rideshareSensors.isEmpty()
        if (shouldShowLoadingState) {
            stateFlow.update { it.copy(isLoadingRidesharePoints = true, ridesharePointErrorMessage = null) }
        }

        runCatching {
            val ridesharePoints = getRidesharePointUseCase.getRidesharePoints(villageId)
            val rideshareSensorIds = getVillageUseCase.getVillageConfig(villageId)
                .sensors
                .filter { it.type == SensorType.RIDESHARE }
                .map { it.id }

            val liveSensorsById = this@MobilityViewModel.getSensorDataUseCase
                .getInitialSensorData(villageId)
                .associateBy { it.id }
            val rideShareSensors = rideshareSensorIds.mapNotNull { liveSensorsById[it] }

            ridesharePoints to rideShareSensors
        }.onSuccess { (ridesharePoints, rideShareSensors) ->
            stateFlow.update {
                it.copy(
                    isLoadingRidesharePoints = false,
                    ridesharePointErrorMessage = null,
                    ridesharePoints = ridesharePoints,
                    rideshareSensors = rideShareSensors
                )
            }
        }.onFailure { error ->
            stateFlow.update {
                it.copy(
                    isLoadingRidesharePoints = false,
                    ridesharePointErrorMessage = error.message ?: "Mitfahrgelegenheiten konnten nicht geladen werden"
                )
            }
        }
    }

    private companion object {
        const val POLLING_INTERVAL_MS = 5000L
    }
}

@OptIn(ExperimentalTime::class)
private fun getCurrentTimetableDateAndHour(): Pair<String, String> {
    val now = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault())
    val isoDate = now.date.toString() // yyyy-MM-dd
    val date = "${isoDate.substring(2, 4)}${isoDate.substring(5, 7)}${isoDate.substring(8, 10)}"
    val hour = now.hour.toString().padStart(2, '0')
    return date to hour
}


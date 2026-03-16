package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetDeparturesUseCase
import de.tif23.studienarbeit.model.usecase.GetRidesharePointUseCase
import de.tif23.studienarbeit.model.usecase.GetVillageTrainStationsUseCase
import de.tif23.studienarbeit.model.usecase.GetVillageUseCase
import de.tif23.studienarbeit.viewmodel.data.Coordinates
import de.tif23.studienarbeit.viewmodel.data.Station
import de.tif23.studienarbeit.viewmodel.data.state.MobilityViewModelState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

class MobilityViewModel(
    private val getRidesharePointUseCase: GetRidesharePointUseCase = GetRidesharePointUseCase(),
    private val getDeparturesUseCase: GetDeparturesUseCase = GetDeparturesUseCase(),
    private val getVillageUseCase: GetVillageUseCase = GetVillageUseCase(),
    private val getVillageTrainStationsUseCase: GetVillageTrainStationsUseCase = GetVillageTrainStationsUseCase(),
    private val selectedVillageSettingsStore: SelectedVillageSettingsStore = SelectedVillageSettingsStore()
) : ViewModel() {
    private val stateFlow = MutableStateFlow(MobilityViewModelState())

    val viewState = stateFlow.asStateFlow()

    init {
        loadStations()
        loadRidesharePoints()
    }

    fun loadStations() {
        viewModelScope.launch {
            stateFlow.update { it.copy(isLoadingStations = true, stationErrorMessage = null, stations = emptyList()) }

            val villageId = selectedVillageSettingsStore.getSelectedVillageId()
            if (villageId == null) {
                stateFlow.update {
                    it.copy(isLoadingStations = false, stationErrorMessage = "Kein Dorf ausgewählt.", stations = emptyList())
                }
                return@launch
            }

            runCatching {
                val villageName = getVillageUseCase.getVillageConfig(villageId).village.name
                val stationBaseData = getVillageTrainStationsUseCase.getTopStationsForVillage(villageName, limit = 5)
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
        viewModelScope.launch {
            stateFlow.update { it.copy(isLoadingRidesharePoints = true, ridesharePointErrorMessage = null) }

            val villageId = selectedVillageSettingsStore.getSelectedVillageId()
            if (villageId == null) {
                stateFlow.update {
                    it.copy(isLoadingRidesharePoints = false, ridesharePointErrorMessage = "Kein Dorf ausgewählt.")
                }
                return@launch
            }

            runCatching {
                getRidesharePointUseCase.getRidesharePoints(villageId)
            }.onSuccess { ridesharePoints ->
                stateFlow.update {
                    it.copy(
                        isLoadingRidesharePoints = false,
                        ridesharePoints = ridesharePoints
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


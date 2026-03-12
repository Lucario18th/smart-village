package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetDeparturesUseCase
import de.tif23.studienarbeit.model.usecase.GetRidesharePointUseCase
import de.tif23.studienarbeit.model.usecase.GetVillageTrainStationsUseCase
import de.tif23.studienarbeit.model.usecase.GetVillageUseCase
import de.tif23.studienarbeit.viewmodel.data.RidesharePoint
import de.tif23.studienarbeit.viewmodel.data.StationDeparture
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
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
    private val _uiState = MutableStateFlow(MobilityTransitUiState(isLoading = true))
    val uiState: StateFlow<MobilityTransitUiState> = _uiState.asStateFlow()

    private val _carpoolUiState = MutableStateFlow(MobilityCarpoolUiState(isLoading = true))
    val carpoolUiState: StateFlow<MobilityCarpoolUiState> = _carpoolUiState.asStateFlow()

    init {
        refresh()
        refreshCarpool()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null, stations = emptyList()) }

            val villageId = selectedVillageSettingsStore.getSelectedVillageId()
            if (villageId == null) {
                _uiState.value = MobilityTransitUiState(
                    isLoading = false,
                    errorMessage = "Kein Dorf ausgewählt."
                )
                return@launch
            }

            runCatching {
                val villageName = getVillageUseCase.getVillageConfig(villageId).village.name
                val stations = getVillageTrainStationsUseCase.getTopStationsForVillage(villageName, limit = 5)
                val (date, hour) = getCurrentTimetableDateAndHour()

                stations.map { station ->
                    val departures = runCatching {
                        getDeparturesUseCase(station.eva.toString(), date, hour)
                    }.getOrDefault(emptyList())

                    TransitStationCardState(
                        stationId = station.eva.toString(),
                        name = station.name,
                        distance = "Beispielbahnhof",
                        departures = departures.take(3)
                    )
                }
            }.onSuccess { stationCards ->
                _uiState.value = MobilityTransitUiState(
                    isLoading = false,
                    stations = stationCards
                )
            }.onFailure { error ->
                _uiState.value = MobilityTransitUiState(
                    isLoading = false,
                    errorMessage = error.message ?: "Abfahrten konnten nicht geladen werden"
                )
            }
        }
    }

    fun refreshCarpool() {
        viewModelScope.launch {
            _carpoolUiState.update { it.copy(isLoading = true, errorMessage = null) }

            val villageId = selectedVillageSettingsStore.getSelectedVillageId()
            if (villageId == null) {
                _carpoolUiState.value = MobilityCarpoolUiState(
                    isLoading = false,
                    errorMessage = "Kein Dorf ausgewählt."
                )
                return@launch
            }

            runCatching {
                getRidesharePointUseCase.getRidesharePoints(villageId)
            }.onSuccess { ridesharePoints ->
                _carpoolUiState.value = MobilityCarpoolUiState(
                    isLoading = false,
                    ridesharePoints = ridesharePoints
                )
            }.onFailure { error ->
                _carpoolUiState.value = MobilityCarpoolUiState(
                    isLoading = false,
                    errorMessage = error.message ?: "Mitfahrbänke konnten nicht geladen werden"
                )
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

data class MobilityTransitUiState(
    val isLoading: Boolean = false,
    val stations: List<TransitStationCardState> = emptyList(),
    val errorMessage: String? = null
)

data class TransitStationCardState(
    val stationId: String?,
    val name: String,
    val distance: String,
    val departures: List<StationDeparture>
)

data class MobilityCarpoolUiState(
    val isLoading: Boolean = false,
    val ridesharePoints: List<RidesharePoint> = emptyList(),
    val errorMessage: String? = null
)


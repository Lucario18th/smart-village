package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetRidesharePointUseCase
import de.tif23.studienarbeit.model.usecase.GetTransitOverviewUseCase
import de.tif23.studienarbeit.model.usecase.TransitDepartureItem
import de.tif23.studienarbeit.viewmodel.data.RidesharePoint
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.time.Clock

class MobilityViewModel(
    private val getTransitOverviewUseCase: GetTransitOverviewUseCase = GetTransitOverviewUseCase(),
    private val getRidesharePointUseCase: GetRidesharePointUseCase = GetRidesharePointUseCase(),
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
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            runCatching {
                getTransitOverviewUseCase(nowUtcMillis = Clock.System.now().toEpochMilliseconds())
            }.onSuccess { stations ->
                _uiState.value = MobilityTransitUiState(
                    isLoading = false,
                    stations = stations.map { station ->
                        TransitStationCardState(
                            stationId = station.stationId,
                            name = station.stationName,
                            distance = station.distanceLabel,
                            departures = station.departures
                        )
                    }
                )
            }.onFailure { error ->
                _uiState.value = MobilityTransitUiState(
                    isLoading = false,
                    errorMessage = error.message ?: "Unbekannter Fehler beim Laden der Abfahrten"
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

            println(getRidesharePointUseCase.getRidesharePoints(villageId))

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

data class MobilityTransitUiState(
    val isLoading: Boolean = false,
    val stations: List<TransitStationCardState> = emptyList(),
    val errorMessage: String? = null
)

data class MobilityCarpoolUiState(
    val isLoading: Boolean = false,
    val ridesharePoints: List<RidesharePoint> = emptyList(),
    val errorMessage: String? = null
)

data class TransitStationCardState(
    val stationId: String?,
    val name: String,
    val distance: String,
    val departures: List<TransitDepartureItem>
)


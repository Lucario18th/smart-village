package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.usecase.GetStationDeparturesUseCase
import de.tif23.studienarbeit.model.usecase.StationDepartureItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlin.time.Clock

class StationDeparturesViewModel(
    private val getStationDeparturesUseCase: GetStationDeparturesUseCase = GetStationDeparturesUseCase()
) : ViewModel() {
    private val _uiState = MutableStateFlow(StationDeparturesUiState(isLoading = true))
    val uiState: StateFlow<StationDeparturesUiState> = _uiState.asStateFlow()

    fun load(stationId: String, stationName: String, distanceLabel: String) {
        viewModelScope.launch {
            _uiState.value = StationDeparturesUiState(
                isLoading = true,
                stationName = stationName,
                distanceLabel = distanceLabel
            )

            runCatching {
                getStationDeparturesUseCase(nowUtcMillis = Clock.System.now().toEpochMilliseconds(), stopId = stationId)
            }.onSuccess { departures ->
                _uiState.value = StationDeparturesUiState(
                    isLoading = false,
                    stationName = stationName,
                    distanceLabel = distanceLabel,
                    departures = departures
                )
            }.onFailure { error ->
                _uiState.value = StationDeparturesUiState(
                    isLoading = false,
                    stationName = stationName,
                    distanceLabel = distanceLabel,
                    errorMessage = error.message ?: "Abfahrten konnten nicht geladen werden"
                )
            }
        }
    }
}

data class StationDeparturesUiState(
    val isLoading: Boolean = false,
    val stationName: String = "Station",
    val distanceLabel: String = "",
    val departures: List<StationDepartureItem> = emptyList(),
    val errorMessage: String? = null
)

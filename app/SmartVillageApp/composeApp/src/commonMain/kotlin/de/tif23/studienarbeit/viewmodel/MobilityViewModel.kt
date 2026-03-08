package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.usecase.GetTransitOverviewUseCase
import de.tif23.studienarbeit.model.usecase.TransitDepartureItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.time.Clock

class MobilityViewModel(
    private val getTransitOverviewUseCase: GetTransitOverviewUseCase = GetTransitOverviewUseCase()
) : ViewModel() {
    private val _uiState = MutableStateFlow(MobilityTransitUiState(isLoading = true))
    val uiState: StateFlow<MobilityTransitUiState> = _uiState.asStateFlow()

    init {
        refresh()
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
    val departures: List<TransitDepartureItem>
)


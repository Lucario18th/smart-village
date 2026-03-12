package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.usecase.GetDeparturesUseCase
import de.tif23.studienarbeit.viewmodel.data.StationDeparture
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

class StationDeparturesViewModel(
    private val getDeparturesUseCase: GetDeparturesUseCase = GetDeparturesUseCase()
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

            val (date, hour) = getCurrentTimetableDateAndHour()
            runCatching {
                getDeparturesUseCase(stationId, date, hour)
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

@OptIn(ExperimentalTime::class)
private fun getCurrentTimetableDateAndHour(): Pair<String, String> {
    val now = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault())
    val isoDate = now.date.toString() // yyyy-MM-dd
    val date = "${isoDate.substring(2, 4)}${isoDate.substring(5, 7)}${isoDate.substring(8, 10)}"
    val hour = now.hour.toString().padStart(2, '0')
    return date to hour
}

data class StationDeparturesUiState(
    val isLoading: Boolean = false,
    val stationName: String = "Station",
    val distanceLabel: String = "",
    val departures: List<StationDeparture> = emptyList(),
    val errorMessage: String? = null
)

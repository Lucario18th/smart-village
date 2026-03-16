package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import de.tif23.studienarbeit.model.usecase.GetDeparturesUseCase
import de.tif23.studienarbeit.viewmodel.data.TrainType
import de.tif23.studienarbeit.viewmodel.data.state.StationDeparturesViewModelState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlin.reflect.KClass
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

class StationDeparturesViewModel(
    private val stationEvaNo: NavDestinations.StationScreen,
    private val getDeparturesUseCase: GetDeparturesUseCase = GetDeparturesUseCase()
) : ViewModel() {

    class Factory(
        private val stationEvaNo: NavDestinations.StationScreen
    ) : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: KClass<T>, extras: CreationExtras): T {
            return StationDeparturesViewModel(stationEvaNo) as T
        }
    }

    private val stateFlow = MutableStateFlow(StationDeparturesViewModelState(isLoading = true))
    val viewState: StateFlow<StationDeparturesViewModelState> = stateFlow.asStateFlow()

    init {
        loadStations(evaNo = stationEvaNo.stationEvaNo)
    }

    private fun loadStations(evaNo: String) {
        viewModelScope.launch {
            runCatching {
                val (date, hour) = getCurrentTimetableDateAndHour()
                return@runCatching getDeparturesUseCase(evaNo, date, hour)

            }.onSuccess { departures ->
                stateFlow.update {
                    it.copy(
                        isLoading = false,
                        departures = departures,
                        stationName = departures.firstOrNull()?.fromStation ?: "",
                        filteredDepartures = departures
                    )
                }
            }.onFailure { error ->
                stateFlow.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Abfahrten konnten nicht geladen werden."
                    )
                }
            }
        }
    }

    fun applyFilter(filter: TrainType?) {
        val departures = viewState.value.departures
        stateFlow.update { state ->
            when (filter) {
                TrainType.REGIONAL -> state.copy(
                    filteredDepartures = departures.filter { it.category == TrainType.REGIONAL },
                    currentFilter = filter
                )

                TrainType.LONG_DISTANCE -> state.copy(
                    filteredDepartures = departures.filter { it.category == TrainType.LONG_DISTANCE },
                    currentFilter = filter
                )

                TrainType.S -> state.copy(
                    filteredDepartures = departures.filter { it.category == TrainType.S },
                    currentFilter = filter
                )

                null -> state.copy(filteredDepartures = departures, currentFilter = filter)
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

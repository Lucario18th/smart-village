package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.StationDeparture
import de.tif23.studienarbeit.viewmodel.data.TrainType

data class StationDeparturesViewModelState(
    val isLoading: Boolean = false,
    val stationName: String = "",
    val distanceLabel: String = "500m",
    val departures: List<StationDeparture> = emptyList(),
    val filteredDepartures: List<StationDeparture> = emptyList(),
    val errorMessage: String? = null,
    val currentFilter: TrainType? = null
)
package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.StationDeparture
import de.tif23.studienarbeit.viewmodel.data.VillageConfig

data class MapScreenViewModelState(
    val village: VillageConfig? = null,
    val isLoading: Boolean = false,
    val sheetContent: MapSheetContent? = null
)

sealed interface MapSheetContent {
    data class Station(
        val evaNo: String,
        val stationName: String,
        val departures: List<StationDeparture> = emptyList(),
        val isLoading: Boolean = false,
        val errorMessage: String? = null
    ) : MapSheetContent

    data class Sensor(
        val id: Int,
        val name: String,
        val type: String,
        val value: String,
        val unit: String,
        val isRideshareBench: Boolean
    ) : MapSheetContent

    data class Container(
        val label: String
    ) : MapSheetContent
}


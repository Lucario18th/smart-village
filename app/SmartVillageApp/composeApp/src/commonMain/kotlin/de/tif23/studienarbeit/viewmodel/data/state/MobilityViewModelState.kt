package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.RidesharePoint
import de.tif23.studienarbeit.viewmodel.data.Sensor
import de.tif23.studienarbeit.viewmodel.data.Station

data class MobilityViewModelState(
    val stations: List<Station> = emptyList(),
    val isLoadingStations: Boolean = false,
    val stationErrorMessage: String? = null,
    val isLoadingRidesharePoints: Boolean = false,
    val ridesharePointErrorMessage: String? = null,
    val ridesharePoints: List<RidesharePoint> = emptyList(),
    val rideshareSensors: List<Sensor> = emptyList()
)

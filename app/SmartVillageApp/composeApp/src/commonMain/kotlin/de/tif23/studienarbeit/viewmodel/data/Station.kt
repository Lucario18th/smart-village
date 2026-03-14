package de.tif23.studienarbeit.viewmodel.data

data class Station(
    val evaNo: String,
    val name: String,
    val distance: String,
    val departures: List<StationDeparture>,
    val coordinates: Coordinates
)

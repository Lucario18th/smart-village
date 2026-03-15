package de.tif23.studienarbeit.viewmodel.data

import kotlinx.serialization.Serializable

@Serializable
data class TrainStation(
    val name: String,
    val lat: Double,
    val lon: Double,
    val eva: Int
)

@Serializable
data class TrainStationList(

    val freiburg: List<TrainStation>,
    val buggingen: List<TrainStation>,
    val loerrach: List<TrainStation>
)

package de.tif23.studienarbeit.viewmodel.data

import kotlinx.datetime.LocalDateTime

data class StationDeparture(
    val trainNumber: String,
    val fromStation: String,
    val line: String,
    val destination: String,
    val stops: List<String>,
    val departure: LocalDateTime,
    val platform: String,
    val category: TrainType
)

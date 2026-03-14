package de.tif23.studienarbeit.viewmodel.data

import kotlinx.datetime.LocalDateTime

data class StationDeparture(
    val trainNumber: String,
    val fromStation: String,
    val changedLine: String?,
    val line: String,
    val destination: String,
    val changedDestination: String?,
    val stops: List<String>,
    val changedStops: List<String>?,
    val changedDeparture: LocalDateTime?,
    val departure: LocalDateTime,
    val changedPlatform: String?,
    val platform: String,
    val status: TripStatus?,
    val category: TrainType,
    val stationEvaNo: String
)

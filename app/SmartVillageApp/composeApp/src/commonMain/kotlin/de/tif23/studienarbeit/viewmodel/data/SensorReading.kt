package de.tif23.studienarbeit.viewmodel.data

import kotlinx.datetime.LocalDateTime

data class SensorReading(
    val value: Double,
    val timestamp: LocalDateTime,
    val status: String //TODO: enum?
)

package de.tif23.studienarbeit.model.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SensorUpdate(
    val sensorId: Int,
    val sensorName: String,
    val value: Double,
    @SerialName("ts")
    val timestamp: String,
    val status: String,
    val unit: String
)
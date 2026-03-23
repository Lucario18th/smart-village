package de.tif23.studienarbeit.model.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RemoteSensorData(
    @SerialName("id")
    val sensorId: Int,
    val name: String,
    val type: String,
    val unit: String,
    val latitude: Double?,
    val longitude: Double?,
    val lastReading: RemoteSensorReading?

)

@Serializable
data class RemoteSensorReading(
    val value: Double,
    @SerialName("ts")
    val timestamp: String,
    val status: String
)

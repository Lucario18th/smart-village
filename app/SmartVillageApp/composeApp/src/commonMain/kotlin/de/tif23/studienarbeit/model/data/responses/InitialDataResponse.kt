package de.tif23.studienarbeit.model.data.responses

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class InitialDataResponse(
    val success: Boolean,
    @SerialName("data")
    val initialSensorReading: InitialSensorReading,
    val timestamp: String
)

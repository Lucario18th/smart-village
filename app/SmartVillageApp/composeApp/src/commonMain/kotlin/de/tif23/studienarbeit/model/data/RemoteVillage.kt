package de.tif23.studienarbeit.model.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RemoteVillage(
    @SerialName("villageId")
    val id: Int,
    val name: String,
    val locationName: String,
    val postalCode: RemotePostalCode,
    val sensorCount: Int,
    val features: RemoteVillageFeatures?
)

@Serializable
data class RemoteVillageFeatures(
    val sensorData: Boolean,
    val weather: Boolean,
    val messages: Boolean,
    val events: Boolean,
    val map: Boolean,
    val rideShare: Boolean,
    val textileContainers: Boolean
)

@Serializable
data class RemotePostalCode(
    val zipCode: String,
    val city: String
)

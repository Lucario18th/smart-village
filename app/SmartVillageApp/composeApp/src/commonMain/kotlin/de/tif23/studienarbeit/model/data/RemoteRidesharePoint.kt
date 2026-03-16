package de.tif23.studienarbeit.model.data

import kotlinx.serialization.Serializable

@Serializable
data class RemoteRidesharePoint(
    val id: Int,
    val name: String,
    val description: String,
    val personCount: Int,
    val maxCapacity: Int,
    val latitude: Double,
    val longitude: Double
)
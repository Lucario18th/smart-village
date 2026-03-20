package de.tif23.studienarbeit.model.data

import kotlinx.serialization.Serializable

@Serializable
data class RemoteModule(
    val id: Int,
    val name: String,
    val description: String,
    val iconKey: String,
    val moduleType: String,
    val sensorIds: List<Int>
)

package de.tif23.studienarbeit.model.data

import kotlinx.serialization.Serializable

@Serializable
data class RemoteSensor(
    val id: Int,
    val name: String,
    val type: String,
    val unit: String,
    val latitude: Double?,
    val longitude: Double?
)

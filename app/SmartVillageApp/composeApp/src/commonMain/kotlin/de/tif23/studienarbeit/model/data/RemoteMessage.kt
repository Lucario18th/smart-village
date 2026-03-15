package de.tif23.studienarbeit.model.data

import kotlinx.serialization.Serializable

@Serializable
data class RemoteMessage(
    val id: Int,
    val text: String,
    val priority: String,
    val createdAt: String
)

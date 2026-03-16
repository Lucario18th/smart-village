package de.tif23.studienarbeit.model.data

import kotlinx.serialization.Serializable

@Serializable
data class RemoteSensorDetailVisibility(
    val name: Boolean,
    val type: Boolean,
    val description: Boolean,
    val coordinates: Boolean
)

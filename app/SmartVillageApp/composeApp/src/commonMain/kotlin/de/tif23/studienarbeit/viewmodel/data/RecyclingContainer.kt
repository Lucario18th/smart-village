package de.tif23.studienarbeit.viewmodel.data

import kotlinx.serialization.Serializable

@Serializable
data class RecyclingContainer(
    val id: String,
    val name: String,
    val type: String,
    val coordinates: Coordinates,
    val description: String
)

package de.tif23.studienarbeit.viewmodel.data

import kotlinx.serialization.Serializable

@Serializable
data class Coordinates(
    val lat: Double,
    val lon: Double
)

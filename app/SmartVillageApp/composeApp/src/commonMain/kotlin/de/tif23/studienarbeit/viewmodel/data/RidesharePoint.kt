package de.tif23.studienarbeit.viewmodel.data

data class RidesharePoint(
    val id: Int,
    val name: String,
    val description: String,
    val personCount: Int,
    val maxCapacity: Int,
    val coordinates: Coordinates
)
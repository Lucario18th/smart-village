package de.tif23.studienarbeit.viewmodel.data

data class Sensor(
    val id: Int,
    val name: String,
    val type: String, //TODO: enum?
    val unit: String,
    val coordinates: Coordinates,
    val lastReading: SensorReading?
)

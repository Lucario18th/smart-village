package de.tif23.studienarbeit.viewmodel.data

data class Village(
    val id: Int,
    val name: String,
    val postalCode: String,
    val city: String,
    val locationName: String,
    val sensorCount: Int,
    val features: VillageFeatures,
)

data class VillageFeatures(
    val sensorData: Boolean,
    val weather: Boolean,
    val messages: Boolean,
    val events: Boolean,
    val map: Boolean,
    val rideShare: Boolean,
    val textileContainers: Boolean,
)

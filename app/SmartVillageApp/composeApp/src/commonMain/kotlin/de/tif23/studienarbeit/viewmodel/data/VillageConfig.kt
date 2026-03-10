package de.tif23.studienarbeit.viewmodel.data

data class VillageConfig(
    val village: Village,
    val sensorDetailVisibility: SensorDetailVisibility,
    val sensors: List<Sensor>
)

data class SensorDetailVisibility(
    val name: Boolean,
    val type: Boolean,
    val description: Boolean,
    val coordinates: Boolean
)

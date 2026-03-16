package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.Sensor

data class SensorViewModelState(
    val sensors: List<Sensor> = emptyList(),
    val groupedSensors: List<SensorGroup> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

data class SensorGroup(
    val coordinatesLabel: String,
    val sensors: List<Sensor>
)
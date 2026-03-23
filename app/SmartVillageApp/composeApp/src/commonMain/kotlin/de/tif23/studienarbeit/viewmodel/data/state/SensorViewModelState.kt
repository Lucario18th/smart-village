package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.Sensor
import de.tif23.studienarbeit.viewmodel.data.SensorDetailVisibility

data class SensorViewModelState(
    val sensors: List<Sensor> = emptyList(),
    val sensorDetailVisibility: SensorDetailVisibility? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)
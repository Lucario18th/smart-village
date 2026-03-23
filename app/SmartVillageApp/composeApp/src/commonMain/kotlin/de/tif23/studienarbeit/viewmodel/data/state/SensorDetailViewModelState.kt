package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.Sensor
import de.tif23.studienarbeit.viewmodel.data.SensorDetailVisibility

data class SensorDetailViewModelState(
    val sensorData: Sensor? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val sensorDetailVisibility: SensorDetailVisibility? = null
)

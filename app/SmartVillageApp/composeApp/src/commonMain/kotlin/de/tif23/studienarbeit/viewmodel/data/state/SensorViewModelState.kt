package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.Sensor

data class SensorViewModelState(
    val sensors: List<Sensor> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)
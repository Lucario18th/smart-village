package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetSensorDataUseCase
import de.tif23.studienarbeit.viewmodel.data.Sensor
import de.tif23.studienarbeit.viewmodel.data.state.SensorGroup
import de.tif23.studienarbeit.viewmodel.data.state.SensorViewModelState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

class SensorViewModel(
    private val getSensorsUseCase: GetSensorDataUseCase = GetSensorDataUseCase(),
    private val selectedVillageSettingsStore: SelectedVillageSettingsStore = SelectedVillageSettingsStore()
) : ViewModel() {

    private val stateFlow = MutableStateFlow(SensorViewModelState())

    val viewState = stateFlow.asStateFlow()

    init {
        loadSensors()
    }

    private fun loadSensors() {
        viewModelScope.launch {
            stateFlow.value = stateFlow.value.copy(isLoading = true, errorMessage = null)

            val villageId = selectedVillageSettingsStore.getSelectedVillageId()
            println(villageId)
            if (villageId == null) {
                stateFlow.value = stateFlow.value.copy(
                    isLoading = false,
                    errorMessage = "Kein Dorf ausgewaehlt."
                )
                return@launch
            }

            try {
                val sensors = getSensorsUseCase.getInitialSensorData(villageId)
                println("Viewmodel")
                println(sensors)
                stateFlow.value = stateFlow.value.copy(
                    sensors = sensors,
                    groupedSensors = groupSensorsByCoordinates(sensors),
                    isLoading = false,
                    errorMessage = null
                )
            } catch (exception: Exception) {
                println(exception.message)
                exception.printStackTrace()
                stateFlow.value = stateFlow.value.copy(
                    isLoading = false,
                    errorMessage = "Sensordaten konnten nicht geladen werden."
                )
            }
        }
    }

    private fun groupSensorsByCoordinates(sensors: List<Sensor>): List<SensorGroup> {
        return sensors
            .groupBy { sensor ->
                val lat = sensor.coordinates.lat.toUiCoordinate()
                val lon = sensor.coordinates.lon.toUiCoordinate()
                "Lat: $lat, Lon: $lon"
            }
            .map { (coordinatesLabel, groupedSensors) ->
                SensorGroup(
                    coordinatesLabel = coordinatesLabel,
                    sensors = groupedSensors.sortedBy { it.name }
                )
            }
    }

    private fun Double.toUiCoordinate(): Double {
        return (this * 100000).roundToInt() / 100000.0
    }
}
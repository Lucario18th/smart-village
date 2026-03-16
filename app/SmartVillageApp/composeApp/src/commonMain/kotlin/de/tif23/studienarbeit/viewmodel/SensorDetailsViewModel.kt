package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.MqttSensorRepository
import de.tif23.studienarbeit.provider.MqttClientProvider
import de.tif23.studienarbeit.viewmodel.data.state.SensorDetailViewModelState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SensorDetailsViewModel(
    private val mqttSensorRepository: MqttSensorRepository = MqttSensorRepository()
) : ViewModel() {

    private val stateFlow = MutableStateFlow(SensorDetailViewModelState())

    val viewState = stateFlow.asStateFlow()

    init {
        viewModelScope.launch(Dispatchers.Default) {
            MqttClientProvider.connect("localhost", 1883, 1)
        }

        viewModelScope.launch {
            mqttSensorRepository.observeSensorData(3,1)
                .collect { sensorUpdate ->
                    println("SensorUpdate: $sensorUpdate")
                    stateFlow.value = stateFlow.value.copy(sensorData = sensorUpdate)
                }
        }
    }

    override fun onCleared() {
        MqttClientProvider.disconnect()
        super.onCleared()
    }
}
package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetSensorDataUseCase
import de.tif23.studienarbeit.model.usecase.GetVillageUseCase
import de.tif23.studienarbeit.viewmodel.data.state.SensorViewModelState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class SensorViewModel(
    private val getSensorsUseCase: GetSensorDataUseCase = GetSensorDataUseCase(),
    private val selectedVillageSettingsStore: SelectedVillageSettingsStore = SelectedVillageSettingsStore(),
    private val getVillageUseCase: GetVillageUseCase = GetVillageUseCase()
) : ViewModel() {

    private val stateFlow = MutableStateFlow(SensorViewModelState())
    private var pollingJob: Job? = null

    val viewState = stateFlow.asStateFlow()

    init {
        startPolling()
        loadSensorVisibility()
    }

    fun loadSensorVisibility() {
        stateFlow.value = stateFlow.value.copy(isLoading = true, errorMessage = null)
        viewModelScope.launch {
            runCatching {
                val villageId = selectedVillageSettingsStore.getSelectedVillageId()
                if (villageId == null || villageId == -1) {
                    stateFlow.value = stateFlow.value.copy(isLoading = false, errorMessage = "Kein Dorf ausgewählt.")
                    return@launch
                }
                getVillageUseCase.getVillageConfig(villageId)
            }.onSuccess { villageConfig ->
                stateFlow.update {
                    it.copy(
                        sensorDetailVisibility = villageConfig.sensorDetailVisibility,
                        isLoading = false
                    )
                }
            }.onFailure { e ->
                stateFlow.update {
                    it.copy(
                        sensorDetailVisibility = null,
                        isLoading = false,
                        errorMessage = "Sensor-Detail-Informationen konnten nicht geladen werden."
                    )
                }
            }
        }
    }

    fun startPolling() {
        if (pollingJob?.isActive == true) return

        pollingJob = viewModelScope.launch(Dispatchers.IO) {
            val villageId = selectedVillageSettingsStore.getSelectedVillageId()
            if (villageId == null) {
                stateFlow.update { it.copy(isLoading = false, errorMessage = "Kein Dorf ausgewählt.") }
                return@launch
            }

            while (isActive) {
                loadSensors(villageId)
                delay(POLLING_INTERVAL_MS)
            }
        }
    }

    fun stopPolling() {
        pollingJob?.cancel()
        pollingJob = null
    }

    override fun onCleared() {
        stopPolling()
        super.onCleared()
    }

    private suspend fun loadSensors(villageId: Int) {
        if (stateFlow.value.sensors.isEmpty()) {
            stateFlow.value = stateFlow.value.copy(isLoading = true, errorMessage = null)
        }

        runCatching {
            getSensorsUseCase.getInitialSensorData(villageId)
        }.onSuccess { sensors ->
            stateFlow.value = stateFlow.value.copy(
                sensors = sensors,
                isLoading = false,
                errorMessage = null
            )
        }.onFailure {
            stateFlow.value = stateFlow.value.copy(
                isLoading = false,
                errorMessage = if (stateFlow.value.sensors.isEmpty()) {
                    "Sensordaten konnten nicht geladen werden."
                } else {
                    null
                }
            )
        }
    }

    private companion object {
        const val POLLING_INTERVAL_MS = 5000L
    }
}
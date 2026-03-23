package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetSensorDataUseCase
import de.tif23.studienarbeit.model.usecase.GetVillageUseCase
import de.tif23.studienarbeit.viewmodel.data.state.SensorDetailViewModelState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class SensorDetailsViewModel(
    private val getSensorDataUseCase: GetSensorDataUseCase = GetSensorDataUseCase(),
    private val getVillageUseCase: GetVillageUseCase = GetVillageUseCase(),
    private val selectedVillageStore: SelectedVillageSettingsStore = SelectedVillageSettingsStore()
) : ViewModel() {

    private val stateFlow = MutableStateFlow(SensorDetailViewModelState())
    private var pollingJob: Job? = null
    private var activeSensorId: Int? = null

    val viewState = stateFlow.asStateFlow()

    init {
        loadSensorVisibility()
    }

    fun loadSensorVisibility() {
        stateFlow.value = stateFlow.value.copy(isLoading = true, errorMessage = null)
        viewModelScope.launch {
            runCatching {
                val villageId = selectedVillageStore.getSelectedVillageId()
                if (villageId == null) {
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

    fun startPolling(sensorId: Int) {
        if (pollingJob?.isActive == true && activeSensorId == sensorId) {
            return
        }

        pollingJob?.cancel()
        activeSensorId = sensorId

        pollingJob = viewModelScope.launch(Dispatchers.Default) {
            val villageId = selectedVillageStore.getSelectedVillageId() ?: return@launch

            while (isActive) {
                runCatching {
                    getSensorDataUseCase.getSensorById(villageId, sensorId)
                }.onSuccess { sensor ->
                    stateFlow.value = stateFlow.value.copy(sensorData = sensor)
                }

                delay(POLLING_INTERVAL_MS)
            }
        }
    }

    override fun onCleared() {
        pollingJob?.cancel()
        super.onCleared()
    }

    private companion object {
        const val POLLING_INTERVAL_MS = 5000L
    }
}
package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetSensorDataUseCase
import de.tif23.studienarbeit.viewmodel.data.state.ModulesViewModelState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class ModulesViewModel(
    private val getSensorDataUseCase: GetSensorDataUseCase = GetSensorDataUseCase(),
    private val villageSettingsStore: SelectedVillageSettingsStore = SelectedVillageSettingsStore()
) : ViewModel() {

    private val stateFlow = MutableStateFlow(ModulesViewModelState())

    val viewState = stateFlow.asStateFlow()

    init {
        stateFlow.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            runCatching {
                val villageId = villageSettingsStore.getSelectedVillageId()
                if (villageId == null) {
                    stateFlow.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = "Kein Dorf ausgewählt."
                        )
                    }
                    return@launch
                }
                getSensorDataUseCase.getModules(villageId)
            }.onSuccess { modules ->
                    stateFlow.update {
                        it.copy(
                            modules = modules,
                            isLoading = false,
                            errorMessage = null
                        )
                    }
                }.onFailure { e ->
                    stateFlow.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = "Fehler beim Laden der Module: ${e.message}"
                        )
                    }
                }
        }
    }
}
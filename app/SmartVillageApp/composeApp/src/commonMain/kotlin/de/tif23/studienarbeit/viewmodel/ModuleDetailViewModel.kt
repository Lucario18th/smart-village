package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetSensorDataUseCase
import de.tif23.studienarbeit.viewmodel.data.state.ModuleDetailViewModelState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.reflect.KClass

class ModuleDetailViewModel(
    private val moduleId: Int,
    private val getSensorDataUseCase: GetSensorDataUseCase = GetSensorDataUseCase(),
    private val villageSettingsStore: SelectedVillageSettingsStore = SelectedVillageSettingsStore()
) : ViewModel() {

    class Factory(
        private val moduleId: Int
    ) : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: KClass<T>, extras: CreationExtras): T {
            return ModuleDetailViewModel(moduleId = moduleId) as T
        }
    }

    private val stateFlow = MutableStateFlow(ModuleDetailViewModelState(isLoading = true))
    val viewState: StateFlow<ModuleDetailViewModelState> = stateFlow.asStateFlow()

    init {
        loadModule()
    }

    private fun loadModule() {
        viewModelScope.launch {
            runCatching {
                val villageId = villageSettingsStore.getSelectedVillageId()
                    ?: error("Keine Dorf-ID ausgewaehlt")
                val modules = getSensorDataUseCase.getModules(villageId)
                modules.firstOrNull { it.id == moduleId }
                    ?: error("Modul mit ID $moduleId nicht gefunden")
            }.onSuccess { module ->
                stateFlow.update {
                    it.copy(
                        module = module,
                        isLoading = false,
                        errorMessage = null
                    )
                }
            }.onFailure { error ->
                stateFlow.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Fehler beim Laden der Moduldetails: ${error.message}"
                    )
                }
            }
        }
    }
}


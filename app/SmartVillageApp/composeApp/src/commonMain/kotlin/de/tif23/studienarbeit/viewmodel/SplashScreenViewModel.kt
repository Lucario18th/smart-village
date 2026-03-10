package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetAllVillagesUseCase
import de.tif23.studienarbeit.viewmodel.data.SplashViewModelState
import de.tif23.studienarbeit.viewmodel.data.Village
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class SplashScreenViewModel(
    private val getAllVillagesUseCase: GetAllVillagesUseCase = GetAllVillagesUseCase(),
    private val selectedVillageSettingsStore: SelectedVillageSettingsStore = SelectedVillageSettingsStore(),
) : ViewModel() {
    private val stateFlow = MutableStateFlow(SplashViewModelState())

    val viewState = stateFlow.asStateFlow()

    init {
        viewModelScope.launch {
            stateFlow.update { it.copy(isLoading = true) }
            val villages = getAllVillagesUseCase()
            val selectedVillageId = selectedVillageSettingsStore.getSelectedVillageId()
            val selectedVillage = villages.firstOrNull { it.id == selectedVillageId }
            stateFlow.update {
                it.copy(
                    villages = villages,
                    selectedVillage = selectedVillage,
                    isLoading = false,
                )
            }
        }
    }

    fun updateSelectedVillage(village: Village?) {
        stateFlow.update { it.copy(selectedVillage = village) }
    }

    fun persistSelectedVillage(): Boolean {
        val selectedVillage = stateFlow.value.selectedVillage ?: return false
        selectedVillageSettingsStore.setSelectedVillageId(selectedVillage.id)
        return true
    }
}
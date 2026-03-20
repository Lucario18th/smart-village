package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetVillageUseCase
import de.tif23.studienarbeit.viewmodel.data.state.NavBarViewModelState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class NavBarViewModel(
    private val getVillageUseCase: GetVillageUseCase = GetVillageUseCase(),
    private val selectedVillageSettingsStore: SelectedVillageSettingsStore = SelectedVillageSettingsStore(),
) : ViewModel() {
    private val stateFlow = MutableStateFlow(NavBarViewModelState())

    val viewState = stateFlow.asStateFlow()

    init {
        loadFeatures()
    }

    fun loadFeatures() {
        viewModelScope.launch {
            stateFlow.update { it.copy(isLoading = true, errorMessage = null) }

            val villageId = selectedVillageSettingsStore.getSelectedVillageId()
            if (villageId == null || villageId == -1) {
                stateFlow.update { it.copy(isLoading = false, features = null, errorMessage = null) }
                return@launch
            }

            runCatching {
                getVillageUseCase.getVillageConfig(villageId).village.features
            }.onSuccess { features ->
                stateFlow.update {
                    it.copy(features = features, isLoading = false, errorMessage = null)
                }
            }.onFailure { error ->
                stateFlow.update {
                    it.copy(
                        features = null,
                        isLoading = false,
                        errorMessage = error.message ?: "Features konnten nicht geladen werden."
                    )
                }
            }
        }
    }
}


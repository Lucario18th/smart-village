package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.tif23.studienarbeit.model.repository.AppSettingsStore
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.model.usecase.GetVillageUseCase
import de.tif23.studienarbeit.viewmodel.data.ThemeMode
import de.tif23.studienarbeit.viewmodel.data.Village
import de.tif23.studienarbeit.viewmodel.data.state.SettingsViewModelState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class SettingsViewModel(
    private val getVillageUseCase: GetVillageUseCase = GetVillageUseCase(),
    private val selectedVillageSettingsStore: SelectedVillageSettingsStore = SelectedVillageSettingsStore(),
    private val appSettingsStore: AppSettingsStore = AppSettingsStore(),
) : ViewModel() {
    private val stateFlow = MutableStateFlow(SettingsViewModelState())

    val viewState = stateFlow.asStateFlow()

    init {
        viewModelScope.launch {
            stateFlow.update {
                it.copy(
                    isLoading = true,
                    notificationsEnabled = appSettingsStore.areNotificationsEnabled(),
                    themeMode = appSettingsStore.getThemeMode()
                )
            }

            val villages = runCatching { getVillageUseCase.getAllVillages() }
                .getOrElse {
                    stateFlow.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = "Dorfdaten konnten nicht geladen werden."
                        )
                    }
                    return@launch
                }

            val selectedVillageId = selectedVillageSettingsStore.getSelectedVillageId()
            val selectedVillage = villages.firstOrNull { it.id == selectedVillageId }

            stateFlow.update {
                it.copy(
                    villages = villages,
                    selectedVillage = selectedVillage,
                    isLoading = false,
                    errorMessage = null
                )
            }
        }
    }

    fun selectVillage(village: Village) {
        selectedVillageSettingsStore.setSelectedVillageId(village.id)
        stateFlow.update { it.copy(selectedVillage = village) }
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        appSettingsStore.setNotificationsEnabled(enabled)
        stateFlow.update { it.copy(notificationsEnabled = enabled) }
    }

    fun setThemeMode(themeMode: ThemeMode) {
        appSettingsStore.setThemeMode(themeMode)
        stateFlow.update { it.copy(themeMode = themeMode) }
    }
}


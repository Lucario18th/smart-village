package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.ThemeMode
import de.tif23.studienarbeit.viewmodel.data.Village

data class SettingsViewModelState(
    val villages: List<Village> = emptyList(),
    val selectedVillage: Village? = null,
    val notificationsEnabled: Boolean = true,
    val themeMode: ThemeMode = ThemeMode.SYSTEM,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)


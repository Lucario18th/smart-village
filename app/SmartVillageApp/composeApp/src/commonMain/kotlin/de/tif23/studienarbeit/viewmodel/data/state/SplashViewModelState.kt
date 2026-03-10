package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.Village

data class SplashViewModelState(
    val villages: List<Village> = emptyList(),
    val selectedVillage: Village? = null,
    val isLoading: Boolean = false
)
package de.tif23.studienarbeit.viewmodel.data

data class SplashViewModelState(
    val villages: List<Village> = emptyList(),
    val selectedVillage: Village? = null,
    val isLoading: Boolean = false
)
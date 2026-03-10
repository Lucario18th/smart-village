package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.VillageConfig

data class MainViewModelState(
    val village: VillageConfig? = null,
    val isLoading: Boolean = false
)

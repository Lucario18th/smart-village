package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.VillageFeatures

data class NavBarViewModelState(
    val features: VillageFeatures? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)


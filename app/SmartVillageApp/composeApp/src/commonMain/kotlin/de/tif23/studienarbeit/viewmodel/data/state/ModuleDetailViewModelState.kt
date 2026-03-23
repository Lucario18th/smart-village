package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.Module

data class ModuleDetailViewModelState(
    val module: Module? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)


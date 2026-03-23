package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.Module

data class ModulesViewModelState(
    val modules: List<Module> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

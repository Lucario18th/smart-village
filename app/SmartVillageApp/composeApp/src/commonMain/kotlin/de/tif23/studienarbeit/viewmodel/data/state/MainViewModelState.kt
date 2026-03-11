package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.Message
import de.tif23.studienarbeit.viewmodel.data.VillageConfig

data class MainViewModelState(
    val village: VillageConfig? = null,
    val isLoading: Boolean = false,
    val messages: List<Message> = emptyList()
)

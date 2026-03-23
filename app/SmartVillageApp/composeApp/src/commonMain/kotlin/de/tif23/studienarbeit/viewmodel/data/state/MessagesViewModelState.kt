package de.tif23.studienarbeit.viewmodel.data.state

import de.tif23.studienarbeit.viewmodel.data.Message

data class MessagesViewModelState(
    val messages: List<Message> = emptyList(),
    val importantMessages: List<Message> = emptyList(),
    val newsMessages: List<Message> = emptyList(),
    val isLoading: Boolean = true,
    val errorMessage: String? = null
)

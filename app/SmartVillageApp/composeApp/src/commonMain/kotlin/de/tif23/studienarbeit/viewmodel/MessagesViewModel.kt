package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import de.tif23.studienarbeit.model.usecase.GetMessagesUseCase
import de.tif23.studienarbeit.viewmodel.data.state.MessagesViewModelState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.reflect.KClass

class MessagesViewModel(
    private val villageId: NavDestinations.MessagesScreen,
    private val getMessagesUseCase: GetMessagesUseCase = GetMessagesUseCase()
) : ViewModel() {
    class Factory(
        private val villageId: NavDestinations.MessagesScreen
    ) : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: KClass<T>, extras: CreationExtras): T {
            return MessagesViewModel(villageId) as T
        }
    }
    
    private val stateFlow = MutableStateFlow(MessagesViewModelState())
    
    val viewState: StateFlow<MessagesViewModelState> = stateFlow.asStateFlow()
    
    init {
        stateFlow.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            runCatching {
                getMessagesUseCase.getInitialMessages(villageId.villageId)
            }.onSuccess { messages ->
                val sortedMessages = messages.sortedByDescending { it.createdAt }
                val importantMessages = sortedMessages.filter { isImportantPriority(it.priority) }
                val newsMessages = sortedMessages.filterNot { isImportantPriority(it.priority) }

                stateFlow.update {
                    it.copy(
                        messages = sortedMessages,
                        importantMessages = importantMessages,
                        newsMessages = newsMessages,
                        isLoading = false,
                        errorMessage = null
                    )
                }
            }.onFailure {
                stateFlow.update {
                    it.copy(
                        isLoading = false,
                        errorMessage = "Nachrichten konnten nicht geladen werden."
                    )
                }
            }
        }
    }

    private fun isImportantPriority(priority: String): Boolean {
        return when (priority.trim().lowercase()) {
            "hoch", "high", "wichtig", "critical" -> true
            else -> false
        }
    }
}
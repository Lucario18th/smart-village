package de.tif23.studienarbeit.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import de.tif23.studienarbeit.viewmodel.MessagesViewModel
import de.tif23.studienarbeit.viewmodel.data.Message
import org.jetbrains.compose.resources.painterResource
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.back

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessagesScreen(backStack: NavBackStack<NavKey>, viewModel: MessagesViewModel = viewModel()) {
	val state by viewModel.viewState.collectAsState()

	Scaffold(
		topBar = {
			TopAppBar(
				title = { Text("Benachrichtigungen") },
				navigationIcon = {
					IconButton(onClick = { backStack.removeLastOrNull() }) {
						Icon(
							painter = painterResource(Res.drawable.back),
							contentDescription = "Zurück"
						)
					}
				}
			)
		}
	) { paddingValues ->
		when {
			state.isLoading -> {
				Box(
					modifier = Modifier
						.fillMaxSize()
						.padding(paddingValues),
					contentAlignment = Alignment.Center
				) {
					CircularProgressIndicator()
				}
			}

			state.errorMessage != null -> {
				Box(
					modifier = Modifier
						.fillMaxSize()
						.padding(paddingValues),
					contentAlignment = Alignment.Center
				) {
					Text(
						text = state.errorMessage ?: "Unbekannter Fehler",
						color = MaterialTheme.colorScheme.error,
						modifier = Modifier.padding(24.dp)
					)
				}
			}

			state.messages.isEmpty() -> {
				Box(
					modifier = Modifier
						.fillMaxSize()
						.padding(paddingValues),
					contentAlignment = Alignment.Center
				) {
					Text("Keine Benachrichtigungen vorhanden")
				}
			}

			else -> {
				LazyColumn(
					modifier = Modifier
						.fillMaxSize()
						.padding(paddingValues),
					contentPadding = PaddingValues(16.dp),
					verticalArrangement = Arrangement.spacedBy(12.dp)
				) {
					if (state.importantMessages.isNotEmpty()) {
						item {
							Text(
								text = "WICHTIG (${state.importantMessages.size})",
								style = MaterialTheme.typography.titleMedium,
								fontWeight = FontWeight.Bold,
								color = MaterialTheme.colorScheme.error
							)
						}

						items(state.importantMessages.size) { index ->
							ImportantMessageCard(state.importantMessages[index])
						}
					}

					if (state.newsMessages.isNotEmpty()) {
						item {
							Text(
								text = "NEUIGKEITEN",
								style = MaterialTheme.typography.titleMedium,
								fontWeight = FontWeight.SemiBold,
								color = MaterialTheme.colorScheme.primary
							)
						}

						item {
							Card(
								modifier = Modifier.fillMaxWidth(),
								colors = CardDefaults.cardColors(
									containerColor = MaterialTheme.colorScheme.surfaceContainerLow
								)
							) {
								Column {
									state.newsMessages.forEachIndexed { index, message ->
										NewsMessageRow(message)
										if (index < state.newsMessages.lastIndex) {
											HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

@Composable
private fun ImportantMessageCard(message: Message) {
	Card(
		modifier = Modifier.fillMaxWidth(),
		colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
	) {
		Column(modifier = Modifier.padding(16.dp)) {
			Text(
				text = message.text,
				style = MaterialTheme.typography.bodyLarge,
				fontWeight = FontWeight.Bold,
				color = MaterialTheme.colorScheme.onErrorContainer
			)
			Spacer(modifier = Modifier.height(8.dp))
			Text(
				text = formatMessageMeta(message),
				style = MaterialTheme.typography.bodySmall,
				color = MaterialTheme.colorScheme.onErrorContainer
			)
		}
	}
}

@Composable
private fun NewsMessageRow(message: Message) {
	Row(
		modifier = Modifier
			.fillMaxWidth()
			.padding(horizontal = 12.dp, vertical = 14.dp),
		verticalAlignment = Alignment.CenterVertically,
		horizontalArrangement = Arrangement.spacedBy(10.dp)
	) {
		Column(modifier = Modifier.weight(1f)) {
			Text(
				text = message.text,
				style = MaterialTheme.typography.bodyLarge,
				color = MaterialTheme.colorScheme.onSurface
			)
			Spacer(modifier = Modifier.height(2.dp))
			Text(
				text = formatMessageMeta(message),
				style = MaterialTheme.typography.bodySmall,
				color = MaterialTheme.colorScheme.onSurfaceVariant
			)
		}

		Text(
			text = ">",
			color = MaterialTheme.colorScheme.outline
		)
	}
}

private fun formatMessageMeta(message: Message): String {
	val date = message.createdAt.date
	val formattedDate = "${date.dayOfMonth.toString().padStart(2, '0')}.${date.monthNumber.toString().padStart(2, '0')}.${date.year}"
	val formattedTime = "${message.createdAt.hour.toString().padStart(2, '0')}:${message.createdAt.minute.toString().padStart(2, '0')}"
	val priority = message.priority.ifBlank { "Unbekannt" }
	return "$formattedDate - $formattedTime - $priority"

}
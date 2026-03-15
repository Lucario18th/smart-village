package de.tif23.studienarbeit.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import de.tif23.studienarbeit.ui.components.NavBar
import de.tif23.studienarbeit.util.NavBarTabs
import de.tif23.studienarbeit.viewmodel.NavDestinations
import de.tif23.studienarbeit.viewmodel.SettingsViewModel
import de.tif23.studienarbeit.viewmodel.data.ThemeMode
import de.tif23.studienarbeit.viewmodel.data.Village
import org.jetbrains.compose.resources.painterResource
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.arrow_forward

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun SettingsScreen(
    backStack: NavBackStack<NavKey>,
    settingsViewModel: SettingsViewModel = viewModel()
) {
    val state by settingsViewModel.viewState.collectAsState()
    var showVillageDialog by remember { mutableStateOf(false) }
    var showThemeDialog by remember { mutableStateOf(false) }
    var showPrivacyDialog by remember { mutableStateOf(false) }
    var showTermsDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Einstellungen") }
            )
        },
        bottomBar = {
            NavBar(backStack = backStack, currentTab = NavBarTabs.SETTINGS)
        }
    ) { paddingValues ->
        Column (
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                state.isLoading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
                }

                else -> {
                    LazyColumn(
                        //modifier = Modifier.fillMaxSize()
                    ) {
                        item {
                            SettingsSectionHeader("KONTEXT")
                            SettingsRow(
                                title = "Aktuelles Dorf",
                                subtitle = state.selectedVillage?.name ?: "Kein Dorf ausgewählt",
                                trailingElement = {
                                    IconButton(onClick = { backStack.add(NavDestinations.SplashScreen) }) {
                                        Icon(
                                            painter = painterResource(Res.drawable.arrow_forward),
                                            contentDescription = "Dorf ändern"
                                        )
                                    }
                                },
                                onClick = { backStack.add(NavDestinations.SplashScreen) }
                            )
                            HorizontalDivider()
                        }

                        item {
                            SettingsSectionHeader("ALLGEMEIN")
                            SettingsRow(
                                title = "Benachrichtigungen",
                                subtitle = if (state.notificationsEnabled) "Aktiviert" else "Deaktiviert",
                                trailingElement = {
                                    Switch(
                                        checked = state.notificationsEnabled,
                                        onCheckedChange = { settingsViewModel.setNotificationsEnabled(it) }
                                    )
                                },
                                onClick = { settingsViewModel.setNotificationsEnabled(!state.notificationsEnabled) }
                            )
                            HorizontalDivider()
                            SettingsRow(
                                title = "Erscheinungsbild (Theme)",
                                subtitle = themeLabel(state.themeMode),
                                trailingElement = {
                                    IconButton(onClick = { showVillageDialog = true }) {
                                        Icon(
                                            painter = painterResource(Res.drawable.arrow_forward),
                                            contentDescription = "Erscheinungsbild ändern"
                                        )
                                    }
                                },
                                onClick = { showThemeDialog = true }
                            )
                            HorizontalDivider()
                        }

                        state.errorMessage?.let { message ->
                            item {
                                Text(
                                    text = message,
                                    color = MaterialTheme.colorScheme.error,
                                    style = MaterialTheme.typography.bodyMedium,
                                    modifier = Modifier.padding(16.dp)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 18.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = { showPrivacyDialog = true }, modifier = Modifier.weight(1f)) {
                        Text("Datenschutz", textAlign = TextAlign.End, modifier = Modifier)
                    }
                    Text(
                        "|",
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.Center
                    )
                    TextButton(onClick = { showTermsDialog = true }, modifier = Modifier.weight(1f)) {
                        Text("AGB")
                    }
                }
                Text(
                    text = "Smart Village, © 2025, v1.0.0",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )
            }
        }
    }

    if (showVillageDialog) {
        VillageSelectionDialog(
            villages = state.villages,
            selectedVillageId = state.selectedVillage?.id,
            onSelectVillage = {
                settingsViewModel.selectVillage(it)
                showVillageDialog = false
            },
            onDismiss = { showVillageDialog = false }
        )
    }

    if (showThemeDialog) {
        ThemeSelectionDialog(
            selectedThemeMode = state.themeMode,
            onSelectThemeMode = settingsViewModel::setThemeMode,
            onDismiss = { showThemeDialog = false }
        )
    }

    if (showPrivacyDialog) {
        LegalDialog(
            title = "Datenschutz",
            content = "Hier werden die Datenschutzinformationen der Smart Village App angezeigt.",
            onDismiss = { showPrivacyDialog = false }
        )
    }

    if (showTermsDialog) {
        LegalDialog(
            title = "AGBs",
            content = "Hier werden die Allgemeinen Geschäftsbedingungen der Smart Village App angezeigt.",
            onDismiss = { showTermsDialog = false }
        )
    }
}

@Composable
private fun SettingsSectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(start = 16.dp, top = 16.dp, bottom = 8.dp)
    )
}

@Composable
private fun SettingsRow(
    title: String,
    subtitle: String? = null,
    trailingElement: @Composable (() -> Unit)? = null,
    onClick: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = onClick != null) { onClick?.invoke() }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, style = MaterialTheme.typography.titleMedium)
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        if (trailingElement != null) {
            trailingElement()
        }
    }
}

@Composable
private fun VillageSelectionDialog(
    villages: List<Village>,
    selectedVillageId: Int?,
    onSelectVillage: (Village) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Dorf auswählen") },
        text = {
            LazyColumn(
                modifier = Modifier.heightIn(max = 280.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(villages, key = { it.id }) { village ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectVillage(village) }
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = village.name,
                                style = MaterialTheme.typography.bodyLarge
                            )
                            Text(
                                text = "${village.postalCode} ${village.city}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        if (selectedVillageId == village.id) {
                            Text(
                                text = "Ausgewählt",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Schließen")
            }
        }
    )
}

@Composable
private fun ThemeSelectionDialog(
    selectedThemeMode: ThemeMode,
    onSelectThemeMode: (ThemeMode) -> Unit,
    onDismiss: () -> Unit
) {
    val allThemeModes = ThemeMode.entries

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Theme auswählen") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                allThemeModes.forEach { themeMode ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectThemeMode(themeMode) },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedThemeMode == themeMode,
                            onClick = { onSelectThemeMode(themeMode) }
                        )
                        Text(themeLabel(themeMode))
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Fertig")
            }
        }
    )
}

@Composable
private fun LegalDialog(
    title: String,
    content: String,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { Text(content) },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Schließen")
            }
        }
    )
}

private fun themeLabel(themeMode: ThemeMode): String {
    return when (themeMode) {
        ThemeMode.SYSTEM -> "Systemstandard"
        ThemeMode.LIGHT -> "Hell"
        ThemeMode.DARK -> "Dunkel"
    }
}



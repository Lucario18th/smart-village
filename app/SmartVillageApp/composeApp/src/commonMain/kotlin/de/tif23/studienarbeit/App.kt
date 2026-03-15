package de.tif23.studienarbeit

import androidx.compose.runtime.Composable
import de.tif23.studienarbeit.ui.screens.MainScreen
import de.tif23.studienarbeit.ui.theme.SmartVillageTheme

@Composable
fun App() {
    SmartVillageTheme {
        MainScreen()
    }
}
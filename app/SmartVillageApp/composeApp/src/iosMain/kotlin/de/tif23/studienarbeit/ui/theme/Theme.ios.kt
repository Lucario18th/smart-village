package de.tif23.studienarbeit.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.runtime.Composable

@Composable
actual fun getPlatformColorScheme(darkTheme: Boolean): ColorScheme? {
    return null // iOS unterstützt kein Dynamic Color
}
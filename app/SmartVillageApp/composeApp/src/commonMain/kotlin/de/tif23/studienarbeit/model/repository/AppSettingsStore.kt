package de.tif23.studienarbeit.model.repository

import com.russhwolf.settings.Settings
import de.tif23.studienarbeit.viewmodel.data.ThemeMode

class AppSettingsStore(
    private val settings: Settings = Settings()
) {
    fun areNotificationsEnabled(): Boolean {
        return settings.getBoolean(NOTIFICATIONS_ENABLED_KEY, true)
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        settings.putBoolean(NOTIFICATIONS_ENABLED_KEY, enabled)
    }

    fun getThemeMode(): ThemeMode {
        val storedTheme = settings.getString(THEME_MODE_KEY, ThemeMode.SYSTEM.name)
        return ThemeMode.entries.firstOrNull { it.name == storedTheme } ?: ThemeMode.SYSTEM
    }

    fun setThemeMode(themeMode: ThemeMode) {
        settings.putString(THEME_MODE_KEY, themeMode.name)
    }

    private companion object {
        const val NOTIFICATIONS_ENABLED_KEY = "notifications_enabled"
        const val THEME_MODE_KEY = "theme_mode"
    }
}


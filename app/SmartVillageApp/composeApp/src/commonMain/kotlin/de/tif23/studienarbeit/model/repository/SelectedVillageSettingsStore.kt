package de.tif23.studienarbeit.model.repository

import com.russhwolf.settings.Settings

class SelectedVillageSettingsStore(
    private val settings: Settings = Settings()
) {
    fun getSelectedVillageId(): Int? {
        return if (settings.hasKey(SELECTED_VILLAGE_ID_KEY)) {
            settings.getInt(SELECTED_VILLAGE_ID_KEY, -1)
        } else {
            null
        }
    }

    fun setSelectedVillageId(villageId: Int) {
        settings.putInt(SELECTED_VILLAGE_ID_KEY, villageId)
    }

    fun clearSelectedVillageId() {
        settings.remove(SELECTED_VILLAGE_ID_KEY)
    }

    private companion object {
        const val SELECTED_VILLAGE_ID_KEY = "selected_village_id"
    }
}


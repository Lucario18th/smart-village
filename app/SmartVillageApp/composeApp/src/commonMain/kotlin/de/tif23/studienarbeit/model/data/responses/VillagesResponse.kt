package de.tif23.studienarbeit.model.data.responses

import de.tif23.studienarbeit.model.data.RemoteVillage
import kotlinx.serialization.Serializable

@Serializable
data class VillagesResponse(
    val success: Boolean,
    val data: List<RemoteVillage>,
    val timestamp: String
)

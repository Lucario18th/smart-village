package de.tif23.studienarbeit.model.data.responses

import de.tif23.studienarbeit.model.data.RemoteVillage
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class VillagesResponse(
    val success: Boolean,
    @SerialName("data")
    val villages: List<RemoteVillage>,
    val timestamp: String
)

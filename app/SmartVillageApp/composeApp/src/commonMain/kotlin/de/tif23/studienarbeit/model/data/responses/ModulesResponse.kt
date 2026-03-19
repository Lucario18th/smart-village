package de.tif23.studienarbeit.model.data.responses

import de.tif23.studienarbeit.model.data.RemoteModule
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ModulesResponse(
    val success: Boolean,
    @SerialName("data")
    val modules: List<RemoteModule>,
    val timestamp: String
)
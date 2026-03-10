package de.tif23.studienarbeit.model.data.responses

import de.tif23.studienarbeit.model.data.RemotePostalCode
import de.tif23.studienarbeit.model.data.RemoteSensor
import de.tif23.studienarbeit.model.data.RemoteSensorDetailVisibility
import de.tif23.studienarbeit.model.data.RemoteVillageFeatures
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class VillageConfigResponse(
    val success: Boolean,
    @SerialName("data")
    val villageConfig: RemoteVillageConfig,
    val timestamp: String
)

@Serializable
data class RemoteVillageConfig(
    val villageId: Int,
    val name: String,
    val locationName: String,
    val postalCode: RemotePostalCode,
    val features: RemoteVillageFeatures,
    val sensorDetailVisibility: RemoteSensorDetailVisibility,
    val sensors: List<RemoteSensor>,
)

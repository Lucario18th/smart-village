package de.tif23.studienarbeit.model.data.responses

import de.tif23.studienarbeit.model.data.RemoteMessage
import de.tif23.studienarbeit.model.data.RemoteModule
import de.tif23.studienarbeit.model.data.RemoteRidesharePoint
import de.tif23.studienarbeit.model.data.RemoteSensorData
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class InitialSensorReading(
    val villageId: Int,
    val sensors: List<RemoteSensorData> = emptyList(),
    val messages: List<RemoteMessage> = emptyList(),
    @SerialName("rideshares")
    val ridesharePoints: List<RemoteRidesharePoint> = emptyList(),
    val modules: List<RemoteModule> = emptyList()

    )

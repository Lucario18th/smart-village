package de.tif23.studienarbeit.model.data.responses

import de.tif23.studienarbeit.model.data.RemoteMessage
import de.tif23.studienarbeit.model.data.RemoteRideShareOffer
import de.tif23.studienarbeit.model.data.RemoteSensorData
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class InitialSensorReading(
    val villageId: Int,
    val sensors: List<RemoteSensorData>,
    val messages: List<RemoteMessage>,
    @SerialName("rideshares")
    val rideShareOffers: List<RemoteRideShareOffer>,

    )

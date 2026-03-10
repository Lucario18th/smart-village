package de.tif23.studienarbeit.model

import de.tif23.studienarbeit.model.data.RemoteVillage
import de.tif23.studienarbeit.viewmodel.data.Village
import de.tif23.studienarbeit.viewmodel.data.VillageFeatures

fun RemoteVillage.toDomain(): Village {
    return Village(
        id = this.id,
        name = this.name,
        postalCode = this.postalCode.zipCode,
        city = this.postalCode.city,
        locationName = this.locationName,
        sensorCount = this.sensorCount,
        features = VillageFeatures(
            sensorData = this.features.sensorData,
            weather = this.features.weather,
            messages = this.features.messages,
            events = this.features.events,
            map = this.features.map,
            rideShare = this.features.rideShare,
            textileContainers = this.features.textileContainers,
        )
    )
}
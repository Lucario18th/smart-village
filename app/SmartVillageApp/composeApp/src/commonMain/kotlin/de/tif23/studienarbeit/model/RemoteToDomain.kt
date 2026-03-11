package de.tif23.studienarbeit.model

import de.tif23.studienarbeit.model.data.RemoteMessage
import de.tif23.studienarbeit.model.data.RemoteSensor
import de.tif23.studienarbeit.model.data.RemoteSensorData
import de.tif23.studienarbeit.model.data.RemoteVillage
import de.tif23.studienarbeit.model.data.responses.RemoteVillageConfig
import de.tif23.studienarbeit.viewmodel.data.Coordinates
import de.tif23.studienarbeit.viewmodel.data.Message
import de.tif23.studienarbeit.viewmodel.data.Sensor
import de.tif23.studienarbeit.viewmodel.data.SensorDetailVisibility
import de.tif23.studienarbeit.viewmodel.data.SensorReading
import de.tif23.studienarbeit.viewmodel.data.Village
import de.tif23.studienarbeit.viewmodel.data.VillageConfig
import de.tif23.studienarbeit.viewmodel.data.VillageFeatures
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlin.time.Instant

fun RemoteVillage.toDomain(): Village {
    return Village(
        id = this.id,
        name = this.name,
        postalCode = this.postalCode.zipCode,
        city = this.postalCode.city,
        locationName = this.locationName,
        sensorCount = this.sensorCount,
        features = if (this.features == null) null else VillageFeatures(
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

fun RemoteSensor.toDomain(): Sensor {
    return Sensor(
        id = this.id,
        name = this.name,
        type = this.type,
        unit = this.unit,
        coordinates = Coordinates(
            lat = this.latitude,
            lon = this.longitude
        ),
        lastReading = null
    )
}

fun RemoteSensorData.toDomain(): Sensor {
    return Sensor(
        id = this.sensorId,
        name = this.name,
        type = this.type,
        unit = this.unit,
        coordinates = Coordinates(
            lat = this.latitude,
            lon = this.longitude
        ),
        lastReading = if (this.lastReading == null) null else SensorReading(
            value = this.lastReading.value,
            timestamp = parseRemoteDateTime(this.lastReading.timestamp),
            status = this.lastReading.status
        )
    )
}


fun RemoteVillageConfig.toDomain(): VillageConfig {
    return VillageConfig(
        village = Village(
            id = this.villageId,
            name = this.name,
            postalCode = this.postalCode.zipCode,
            city = this.postalCode.city,
            locationName = this.locationName,
            sensorCount = this.sensors.size,
            features = VillageFeatures(
                sensorData = this.features.sensorData,
                weather = this.features.weather,
                messages = this.features.messages,
                events = this.features.events,
                map = this.features.map,
                rideShare = this.features.rideShare,
                textileContainers = this.features.textileContainers,
            )
        ),
        sensorDetailVisibility = SensorDetailVisibility(
            name = this.sensorDetailVisibility.name,
            type = this.sensorDetailVisibility.type,
            description = this.sensorDetailVisibility.description,
            coordinates = this.sensorDetailVisibility.coordinates
        ),
        sensors = this.sensors.map { it.toDomain() }
    )
}

fun RemoteMessage.toDomain(): Message {
    return Message(
        id = this.id,
        text = this.text,
        priority = this.priority,
        createdAt = parseRemoteDateTime(this.createdAt)
    )
}

private fun parseRemoteDateTime(value: String): LocalDateTime {
    return runCatching {
        Instant.parse(value).toLocalDateTime(TimeZone.currentSystemDefault())
    }.getOrElse {
        LocalDateTime.parse(value)
    }
}


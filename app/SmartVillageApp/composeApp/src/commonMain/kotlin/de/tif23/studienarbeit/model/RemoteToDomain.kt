package de.tif23.studienarbeit.model

import de.tif23.studienarbeit.model.data.RemoteMessage
import de.tif23.studienarbeit.model.data.RemoteModule
import de.tif23.studienarbeit.model.data.RemoteRidesharePoint
import de.tif23.studienarbeit.model.data.RemoteSensor
import de.tif23.studienarbeit.model.data.RemoteSensorData
import de.tif23.studienarbeit.model.data.RemoteVillage
import de.tif23.studienarbeit.model.data.responses.RemoteVillageConfig
import de.tif23.studienarbeit.model.data.responses.TimeTableChange
import de.tif23.studienarbeit.model.data.responses.TimeTableEntry
import de.tif23.studienarbeit.viewmodel.data.Coordinates
import de.tif23.studienarbeit.viewmodel.data.Message
import de.tif23.studienarbeit.viewmodel.data.Module
import de.tif23.studienarbeit.viewmodel.data.ModuleIcon
import de.tif23.studienarbeit.viewmodel.data.RidesharePoint
import de.tif23.studienarbeit.viewmodel.data.Sensor
import de.tif23.studienarbeit.viewmodel.data.SensorDetailVisibility
import de.tif23.studienarbeit.viewmodel.data.SensorReading
import de.tif23.studienarbeit.viewmodel.data.SensorType
import de.tif23.studienarbeit.viewmodel.data.StationDeparture
import de.tif23.studienarbeit.viewmodel.data.TrainType
import de.tif23.studienarbeit.viewmodel.data.TripStatus
import de.tif23.studienarbeit.viewmodel.data.Village
import de.tif23.studienarbeit.viewmodel.data.VillageConfig
import de.tif23.studienarbeit.viewmodel.data.VillageFeatures
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlin.time.ExperimentalTime
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
        type = getSensorType(this.type),
        unit = this.unit,
        coordinates = if (this.latitude == null || this.longitude == null) null else Coordinates(
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
        type = getSensorType(this.type),
        unit = this.unit,
        coordinates = if (this.latitude == null || this.longitude == null) null else Coordinates(
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
            features = if (this.features == null) null else VillageFeatures(
                sensorData = this.features.sensorData,
                weather = this.features.weather,
                messages = this.features.messages,
                events = this.features.events,
                map = this.features.map,
                rideShare = this.features.rideShare,
                textileContainers = this.features.textileContainers,
            )
        ),
        sensorDetailVisibility = if (this.sensorDetailVisibility == null) null else SensorDetailVisibility(
            name = this.sensorDetailVisibility.name,
            type = this.sensorDetailVisibility.type,
            description = this.sensorDetailVisibility.description,
            coordinates = this.sensorDetailVisibility.coordinates
        ),
        sensors = this.sensors.map { it.toDomain() },
        statusText = this.statusText,
        infoText = this.infoText
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

@OptIn(ExperimentalTime::class)
private fun parseRemoteDateTime(value: String): LocalDateTime {
    return runCatching {
        Instant.parse(value).toLocalDateTime(TimeZone.currentSystemDefault())
    }.getOrElse {
        LocalDateTime.parse(value)
    }
}

fun RemoteRidesharePoint.toDomain(): RidesharePoint {
    return RidesharePoint(
        id = this.id,
        name = this.name,
        description = this.description,
        personCount = this.personCount,
        maxCapacity = this.maxCapacity,
        coordinates = Coordinates(
            lat = this.latitude,
            lon = this.longitude
        )
    )
}


private fun parseCustomDateTime(input: String): LocalDateTime {
    val year = input.substring(0, 2).toInt() + 2000  // yy -> 2000 + yy
    val month = input.substring(2, 4).toInt()
    val day = input.substring(4, 6).toInt()
    val hour = input.substring(6, 8).toInt()
    val minute = input.substring(8, 10).toInt()

    return LocalDateTime(year, month, day, hour, minute)
}

fun TimeTableEntry.toDomain(
    stationName: String,
    timeTableChange: TimeTableChange? = null,
    stationEvaNo: String
): StationDeparture {
    return StationDeparture(
        trainNumber = this.tripLabel.trainNumber,
        stationEvaNo = stationEvaNo,
        fromStation = stationName,
        line = this.departure?.fb ?: "-1",
        changedLine = if (timeTableChange?.departure?.changedLine != this.departure?.fb) timeTableChange?.departure?.changedLine else null,
        destination = this.departure?.plannedPath?.split("|")?.last() ?: "---",
        changedDestination = timeTableChange?.departure?.changedPath?.split("|")?.lastOrNull(),
        stops = this.departure?.plannedPath?.split("|")?.distinct() ?: listOf(),
        changedStops = timeTableChange?.departure?.changedPath?.split("|"),
        departure = parseCustomDateTime(this.departure?.plannedTime ?: "2603121111"),
        changedDeparture = timeTableChange?.departure?.changedTime?.let { parseCustomDateTime(it) },
        changedPlatform = timeTableChange?.departure?.changedPlatform,
        platform = this.departure?.plannedPlatform ?: "-1",
        status = when (timeTableChange?.departure?.status) {
            "p" -> TripStatus.PLANNED
            "a" -> TripStatus.ADDED
            "c" -> TripStatus.CANCELED
            else -> null
        },
        category = when (this.tripLabel.tripCategory) {
            "ICE" -> TrainType.LONG_DISTANCE
            "IC" -> TrainType.LONG_DISTANCE
            "FLX" -> TrainType.LONG_DISTANCE
            "EN" -> TrainType.LONG_DISTANCE
            "EC" -> TrainType.LONG_DISTANCE
            "NJ" -> TrainType.LONG_DISTANCE
            "ECE" -> TrainType.LONG_DISTANCE
            "RB" -> TrainType.REGIONAL
            "RE" -> TrainType.REGIONAL
            "S" -> TrainType.S
            "SWE" -> TrainType.S
            else -> TrainType.LONG_DISTANCE
        },
    )
}

fun RemoteModule.toDomain(remoteSensors: List<RemoteSensorData>): Module {
    return Module(
        id = this.id,
        name = this.name,
        description = this.description,
        iconKey = getModuleIconForIconKey(this.iconKey),
        sensors = remoteSensors.map { it.toDomain() }
    )
}

fun getModuleIconForIconKey(iconKey: String): ModuleIcon {
    return when (iconKey) {
        "sensors" -> ModuleIcon.SENSOR
        "weather" -> ModuleIcon.WEATHER
        "messages" -> ModuleIcon.MESSAGES
        "map" -> ModuleIcon.MAP
        "rideshare" -> ModuleIcon.MOBILITY
        "events" -> ModuleIcon.EVENTS
        "textile" -> ModuleIcon.CONTAINER
        "tree" -> ModuleIcon.TREES
        "water" -> ModuleIcon.WATER
        "camera" -> ModuleIcon.CAMERA
        "energy" -> ModuleIcon.ENERGY
        else -> ModuleIcon.SENSOR
    }
}

fun getSensorType(type: String): SensorType {
    return when (type) {
        "Temperature" -> SensorType.TEMPERATURE
        "Humidity" -> SensorType.AIR_HUMIDITY
        "Pressure" -> SensorType.AIR_PRESSURE
        "Rainfall" -> SensorType.RAIN
        "Wind Speed" -> SensorType.WIND_SPEED
        "Solar Radiation" -> SensorType.SOLAR_RADIATION
        "Soil Humidity" -> SensorType.SOIL_HUMIDITY
        "CO2" -> SensorType.CO2
        "Mitfahrbank" -> SensorType.RIDESHARE
        else -> SensorType.TEMPERATURE
    }
}
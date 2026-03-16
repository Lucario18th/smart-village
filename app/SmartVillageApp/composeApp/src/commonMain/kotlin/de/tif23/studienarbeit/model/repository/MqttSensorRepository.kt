package de.tif23.studienarbeit.model.repository

import de.tif23.studienarbeit.model.data.SensorUpdate
import de.tif23.studienarbeit.provider.MqttClientProvider
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json

class MqttSensorRepository {
    fun observeSensorData(villageId: Int, sensorId: Int): Flow<SensorUpdate> {
        return MqttClientProvider.messages
            .filter { (topic, _) -> topic == "api/app/village/$villageId/sensors" }
            .map { (_, payload) -> Json.decodeFromString<SensorUpdate>(payload) }
    }
}
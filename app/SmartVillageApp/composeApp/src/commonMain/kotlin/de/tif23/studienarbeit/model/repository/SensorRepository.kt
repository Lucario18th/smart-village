package de.tif23.studienarbeit.model.repository

import de.tif23.studienarbeit.model.constants.SERVER_URL
import de.tif23.studienarbeit.model.data.responses.InitialDataResponse
import de.tif23.studienarbeit.model.data.responses.InitialSensorReading
import de.tif23.studienarbeit.util.getKtorClient
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import kotlinx.serialization.json.Json

class SensorRepository {
    private val client = getKtorClient()

    suspend fun getInitialData(villageId: Int): InitialSensorReading {
        val result = client.get("$SERVER_URL/villages/$villageId/initial-data")
        println(result.bodyAsText())

        val initialDataResponse = Json.decodeFromString<InitialDataResponse>(result.bodyAsText())

        return initialDataResponse.initialSensorReading
    }
}
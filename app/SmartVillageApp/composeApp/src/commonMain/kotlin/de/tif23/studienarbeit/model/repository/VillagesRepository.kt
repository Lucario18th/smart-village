package de.tif23.studienarbeit.model.repository

import de.tif23.studienarbeit.model.constants.SERVER_URL
import de.tif23.studienarbeit.model.data.RemoteVillage
import de.tif23.studienarbeit.model.data.responses.RemoteVillageConfig
import de.tif23.studienarbeit.model.data.responses.VillageConfigResponse
import de.tif23.studienarbeit.model.data.responses.VillagesResponse
import de.tif23.studienarbeit.util.getKtorClient
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import kotlinx.serialization.json.Json

class VillagesRepository {
    private val client = getKtorClient()

    suspend fun getVillages(): List<RemoteVillage> {
        try {
            val result = client.get("$SERVER_URL/villages")
            println(result.bodyAsText())

            val villagesResponse = Json.decodeFromString<VillagesResponse>(result.bodyAsText())
            if (!villagesResponse.success) throw IllegalStateException("Fetch from GET /api/app/villages failed")
            val villages = villagesResponse.villages

            return villages
        } catch (e: Exception) {
            e.printStackTrace()
            return emptyList()
        }

    }

    suspend fun getVillageConfig(id: Int): RemoteVillageConfig {
        try {
            val result = client.get("$SERVER_URL/villages/$id/config")
            println(result.bodyAsText())

            val villagesResponse = Json.decodeFromString<VillageConfigResponse>(result.bodyAsText())
            println(villagesResponse)
            if (!villagesResponse.success) throw IllegalStateException("Fetch from GET /api/app/villages failed")

            return villagesResponse.villageConfig
        } catch (e: Exception) {
            e.printStackTrace()
            throw e
        }
    }
}
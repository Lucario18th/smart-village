package de.tif23.studienarbeit.model.repository

import de.tif23.studienarbeit.model.data.RemoteVillage
import de.tif23.studienarbeit.model.data.responses.VillagesResponse
import de.tif23.studienarbeit.util.getKtorClient
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import kotlinx.serialization.json.Json

class VillagesRepository {
    private val client = getKtorClient()

    suspend fun getVillages(): List<RemoteVillage> {
        try {
            val result = client.get("https://192.168.23.113/api/app/villages")
            println(result.bodyAsText())

            val villagesResponse = Json.decodeFromString<VillagesResponse>(result.bodyAsText())
            if (!villagesResponse.success) throw IllegalStateException("Fetch from GET /api/app/villages failed")
            val villages = villagesResponse.data

            return villages
        } catch (e: Exception) {
            e.printStackTrace()
            return emptyList()
        }

    }
}
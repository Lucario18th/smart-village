package de.tif23.studienarbeit.model.usecase

import de.tif23.studienarbeit.viewmodel.data.TrainStation
import de.tif23.studienarbeit.viewmodel.data.TrainStationList
import kotlinx.serialization.json.Json
import smartvillageapp.composeapp.generated.resources.Res

class GetVillageTrainStationsUseCase {
    suspend fun getTopStationsForVillage(villageName: String, limit: Int = 5): List<TrainStation> {
        val stationData = Res.readBytes("files/bahnhof_koordinaten.json").decodeToString()
        val stationList = Json.decodeFromString<TrainStationList>(stationData)

        val stationsForVillage = when (normalizeVillageName(villageName)) {
            "freiburg" -> stationList.freiburg
            "buggingen" -> stationList.buggingen
            "loerrach" -> stationList.loerrach
            else -> emptyList()
        }

        return stationsForVillage.take(limit)
    }

    private fun normalizeVillageName(villageName: String): String {
        val lowerCaseName = villageName.lowercase()
        return when {
            lowerCaseName.contains("freiburg") -> "freiburg"
            lowerCaseName.contains("buggingen") -> "buggingen"
            lowerCaseName.contains("lörrach") || lowerCaseName.contains("loerrach") -> "loerrach"
            else -> lowerCaseName
        }
    }
}


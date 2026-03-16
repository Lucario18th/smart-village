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

    suspend fun getAllStationsForVillage(villageName: String): List<TrainStation> {
        val stationData = Res.readBytes("files/bahnhof_koordinaten.json").decodeToString()
        val stationList = Json.decodeFromString<TrainStationList>(stationData)

        return when (normalizeVillageName(villageName)) {
            "freiburg" -> stationList.freiburg
            "buggingen" -> stationList.buggingen
            "loerrach" -> stationList.loerrach
            else -> emptyList()
        }
    }

    suspend fun getStationByEva(eva: String, villageName: String): TrainStation? {
        val stationData = Res.readBytes("files/bahnhof_koordinaten.json").decodeToString()
        val stationList = Json.decodeFromString<TrainStationList>(stationData)

        return when (normalizeVillageName(villageName)) {
            "freiburg" -> stationList.freiburg.find { it.eva.toString() == eva }
            "buggingen" -> stationList.buggingen.find { it.eva.toString() == eva }
            "loerrach" -> stationList.loerrach.find { it.eva.toString() == eva }
            else -> null
        }
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


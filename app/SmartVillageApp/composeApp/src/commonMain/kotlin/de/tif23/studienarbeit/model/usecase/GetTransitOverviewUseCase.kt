package de.tif23.studienarbeit.model.usecase

import de.tif23.studienarbeit.model.repository.DepartureResult
import de.tif23.studienarbeit.model.repository.GtfsDate
import de.tif23.studienarbeit.model.repository.TimeTableRepository
import de.tif23.studienarbeit.model.repository.TimeTableRepositoryProvider

class GetTransitOverviewUseCase(
    private val repositoryProvider: suspend () -> TimeTableRepository = {
        TimeTableRepositoryProvider.getRepository()
    }
) {
    private val configuredStations = listOf(
        StationConfig(
            stopId = "de:08336:6600",
            displayName = "Lörrach Hbf",
            distanceLabel = "~0.8km"
        ),
        StationConfig(
            stopId = "de:08336:6630",
            displayName = "Brombach/Hauingen",
            distanceLabel = "~1.1km"
        ),
        StationConfig(
            stopId = "ch:23005:6",
            displayName = "Basel Badischer Bahnhof",
            distanceLabel = "~2.5km"
        )
    )

    suspend operator fun invoke(
        nowUtcMillis: Long,
        departureLimit: Int = 3
    ): List<TransitStationOverview> {
        val repository = repositoryProvider()
        val now = UtcDateTime.fromEpochMillis(nowUtcMillis)

        return configuredStations.map { station ->
            val departures = repository.getNextDeparturesForStation(
                stationIdOrPrefix = station.stopId,
                date = GtfsDate(now.year, now.month, now.day),
                currentTimeSeconds = now.secondsOfDay,
                limit = departureLimit
            )

            TransitStationOverview(
                stationId = station.stopId,
                stationName = station.displayName,
                distanceLabel = station.distanceLabel,
                departures = departures.map { it.toUiDeparture() }
            )
        }
    }
}

class GetStationDeparturesUseCase(
    private val repositoryProvider: suspend () -> TimeTableRepository = {
        TimeTableRepositoryProvider.getRepository()
    }
) {
    suspend operator fun invoke(
        stopId: String,
        nowUtcMillis: Long,
        departureLimit: Int = 40
    ): List<StationDepartureItem> {
        val repository = repositoryProvider()
        val now = UtcDateTime.fromEpochMillis(nowUtcMillis)

        return repository.getNextDeparturesForStation(
            stationIdOrPrefix = stopId,
            date = GtfsDate(now.year, now.month, now.day),
            currentTimeSeconds = now.secondsOfDay,
            limit = departureLimit
        ).map { result ->
            StationDepartureItem(
                time = result.departureTime,
                line = result.routeName,
                destination = result.destination,
                status = "Planmaessig"
            )
        }
    }
}

data class TransitStationOverview(
    val stationId: String?,
    val stationName: String,
    val distanceLabel: String,
    val departures: List<TransitDepartureItem>
)

data class TransitDepartureItem(
    val line: String,
    val destination: String,
    val time: String,
    val status: String
)

data class StationDepartureItem(
    val time: String,
    val line: String,
    val destination: String,
    val status: String
)

private data class StationConfig(
    val stopId: String,
    val displayName: String,
    val distanceLabel: String
)

private data class UtcDateTime(
    val year: Int,
    val month: Int,
    val day: Int,
    val secondsOfDay: Int
) {
    companion object {
        fun fromEpochMillis(epochMillis: Long): UtcDateTime {
            val epochSeconds = floorDiv(epochMillis, 1000L)
            val daysSinceUnixEpoch = floorDiv(epochSeconds, 86_400L)
            val secondsOfDay = floorMod(epochSeconds, 86_400L).toInt()
            val (year, month, day) = civilFromDays(daysSinceUnixEpoch)
            return UtcDateTime(year, month, day, secondsOfDay)
        }

        private fun civilFromDays(daysSinceUnixEpoch: Long): Triple<Int, Int, Int> {
            var z = daysSinceUnixEpoch + 719_468
            val era = if (z >= 0) z / 146_097 else (z - 146_096) / 146_097
            val doe = z - era * 146_097
            val yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365
            var y = yoe + era * 400
            val doy = doe - (365 * yoe + yoe / 4 - yoe / 100)
            val mp = (5 * doy + 2) / 153
            val d = doy - (153 * mp + 2) / 5 + 1
            val m = mp + if (mp < 10) 3 else -9
            y += if (m <= 2) 1 else 0

            return Triple(y.toInt(), m.toInt(), d.toInt())
        }

        private fun floorDiv(a: Long, b: Long): Long {
            var result = a / b
            if ((a xor b) < 0 && result * b != a) {
                result -= 1
            }
            return result
        }

        private fun floorMod(a: Long, b: Long): Long {
            return a - floorDiv(a, b) * b
        }
    }
}

private fun DepartureResult.toUiDeparture(): TransitDepartureItem {
    return TransitDepartureItem(
        line = routeName,
        destination = destination,
        time = departureTime,
        status = "planmäßig"
    )
}

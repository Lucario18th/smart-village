package de.tif23.studienarbeit.model.repository

import org.jetbrains.compose.resources.ExperimentalResourceApi
import smartvillageapp.composeapp.generated.resources.Res

class TimeTableRepository private constructor(
    private val stopsById: Map<String, StationSearchResult>,
    private val searchIndex: List<SearchIndexEntry>,
    private val routesById: Map<String, RouteData>,
    private val tripsById: Map<String, TripData>,
    private val servicesById: Map<String, ServiceCalendar>,
    private val serviceExceptionsByDate: Map<Int, Map<String, Int>>,
    private val departuresByStop: Map<String, List<DepartureSeed>>
) {
    fun searchStations(query: String, limit: Int = 20): List<StationSearchResult> {
        val normalizedQuery = normalizeForSearch(query)
        if (normalizedQuery.isBlank()) {
            return searchIndex.take(limit).map { it.station }
        }

        return searchIndex
            .asSequence()
            .mapNotNull { indexEntry ->
                val score = when {
                    indexEntry.normalizedName.startsWith(normalizedQuery) -> 0
                    indexEntry.normalizedName.contains(normalizedQuery) -> 1
                    else -> null
                }
                score?.let { SearchScoredEntry(indexEntry.station, indexEntry.normalizedName.length, it) }
            }
            .sortedWith(compareBy<SearchScoredEntry>({ it.matchType }, { it.nameLength }, { it.station.name }))
            .take(limit)
            .map { it.station }
            .toList()
    }

    fun getNextDepartures(
        stopId: String,
        date: GtfsDate,
        currentTimeSeconds: Int,
        limit: Int = 20
    ): List<DepartureResult> {
        val seeds = departuresByStop[stopId].orEmpty()
        if (seeds.isEmpty()) return emptyList()

        return seeds
            .asSequence()
            .filter { seed ->
                seed.departureSeconds >= currentTimeSeconds &&
                    isServiceActive(seed.serviceId, date)
            }
            .sortedBy { it.departureSeconds }
            .take(limit)
            .mapNotNull { seed ->
                val route = routesById[seed.routeId] ?: return@mapNotNull null
                val stop = stopsById[stopId] ?: return@mapNotNull null
                DepartureResult(
                    stopId = stop.id,
                    stopName = stop.name,
                    routeName = route.shortName.ifBlank { route.longName.ifBlank { route.id } },
                    destination = seed.destination,
                    departureTime = secondsToClock(seed.departureSeconds),
                    departureSeconds = seed.departureSeconds
                )
            }
            .toList()
    }

    private fun isServiceActive(serviceId: String, date: GtfsDate): Boolean {
        val dateInt = date.toInt()
        val exceptionType = serviceExceptionsByDate[dateInt]?.get(serviceId)
        if (exceptionType == 1) return true
        if (exceptionType == 2) return false

        val service = servicesById[serviceId] ?: return false
        if (dateInt < service.startDate || dateInt > service.endDate) return false

        return when (date.dayOfWeekMondayIs1()) {
            1 -> service.monday
            2 -> service.tuesday
            3 -> service.wednesday
            4 -> service.thursday
            5 -> service.friday
            6 -> service.saturday
            7 -> service.sunday
            else -> false
        }
    }

    companion object {
        @OptIn(ExperimentalResourceApi::class)
        suspend fun fromComposeResources(): TimeTableRepository {
            val gtfsFiles = mapOf(
                "stops.txt" to Res.readBytes("files/gtfs/stops.txt").decodeToString(),
                "routes.txt" to Res.readBytes("files/gtfs/routes.txt").decodeToString(),
                "trips.txt" to Res.readBytes("files/gtfs/trips.txt").decodeToString(),
                "stop_times.txt" to Res.readBytes("files/gtfs/stop_times.txt").decodeToString(),
                "calendar.txt" to Res.readBytes("files/gtfs/calendar.txt").decodeToString(),
                "calendar_dates.txt" to Res.readBytes("files/gtfs/calendar_dates.txt").decodeToString()
            )
            return fromGtfsTexts(gtfsFiles)
        }

        fun fromGtfsTexts(gtfsFiles: Map<String, String>): TimeTableRepository {
            val stops = parseStops(gtfsFiles.requireFile("stops.txt"))
            val routes = parseRoutes(gtfsFiles.requireFile("routes.txt"))
            val trips = parseTrips(gtfsFiles.requireFile("trips.txt"))
            val services = parseCalendar(gtfsFiles.requireFile("calendar.txt"))
            val exceptions = parseCalendarDates(gtfsFiles.requireFile("calendar_dates.txt"))
            val departures = parseStopTimes(gtfsFiles.requireFile("stop_times.txt"), trips)

            val searchIndex = stops.values
                .map { SearchIndexEntry(it, normalizeForSearch(it.name)) }
                .sortedBy { it.station.name }

            return TimeTableRepository(
                stopsById = stops,
                searchIndex = searchIndex,
                routesById = routes,
                tripsById = trips,
                servicesById = services,
                serviceExceptionsByDate = exceptions,
                departuresByStop = departures
            )
        }

        private fun parseStops(content: String): Map<String, StationSearchResult> {
            val rows = parseCsv(content)
            val result = mutableMapOf<String, StationSearchResult>()

            for (row in rows) {
                val stopId = row["stop_id"].orEmpty()
                val stopName = row["stop_name"].orEmpty()
                if (stopId.isBlank() || stopName.isBlank()) continue

                result[stopId] = StationSearchResult(
                    id = stopId,
                    name = stopName,
                    latitude = row["stop_lat"]?.toDoubleOrNull(),
                    longitude = row["stop_lon"]?.toDoubleOrNull()
                )
            }
            return result
        }

        private fun parseRoutes(content: String): Map<String, RouteData> {
            val rows = parseCsv(content)
            return rows.mapNotNull { row ->
                val routeId = row["route_id"].orEmpty()
                if (routeId.isBlank()) return@mapNotNull null
                routeId to RouteData(
                    id = routeId,
                    shortName = row["route_short_name"].orEmpty(),
                    longName = row["route_long_name"].orEmpty()
                )
            }.toMap()
        }

        private fun parseTrips(content: String): Map<String, TripData> {
            val rows = parseCsv(content)
            return rows.mapNotNull { row ->
                val tripId = row["trip_id"].orEmpty()
                val routeId = row["route_id"].orEmpty()
                val serviceId = row["service_id"].orEmpty()
                if (tripId.isBlank() || routeId.isBlank() || serviceId.isBlank()) return@mapNotNull null

                tripId to TripData(
                    tripId = tripId,
                    routeId = routeId,
                    serviceId = serviceId,
                    destination = row["trip_headsign"].orEmpty()
                )
            }.toMap()
        }

        private fun parseCalendar(content: String): Map<String, ServiceCalendar> {
            val rows = parseCsv(content)
            return rows.mapNotNull { row ->
                val serviceId = row["service_id"].orEmpty()
                if (serviceId.isBlank()) return@mapNotNull null

                serviceId to ServiceCalendar(
                    serviceId = serviceId,
                    monday = row["monday"] == "1",
                    tuesday = row["tuesday"] == "1",
                    wednesday = row["wednesday"] == "1",
                    thursday = row["thursday"] == "1",
                    friday = row["friday"] == "1",
                    saturday = row["saturday"] == "1",
                    sunday = row["sunday"] == "1",
                    startDate = row["start_date"]?.toIntOrNull() ?: Int.MIN_VALUE,
                    endDate = row["end_date"]?.toIntOrNull() ?: Int.MAX_VALUE
                )
            }.toMap()
        }

        private fun parseCalendarDates(content: String): Map<Int, Map<String, Int>> {
            val rows = parseCsv(content)
            val result = mutableMapOf<Int, MutableMap<String, Int>>()

            for (row in rows) {
                val serviceId = row["service_id"].orEmpty()
                val date = row["date"]?.toIntOrNull()
                val exceptionType = row["exception_type"]?.toIntOrNull()
                if (serviceId.isBlank() || date == null || exceptionType == null) continue

                result.getOrPut(date) { mutableMapOf() }[serviceId] = exceptionType
            }

            return result
        }

        private fun parseStopTimes(
            content: String,
            tripsById: Map<String, TripData>
        ): Map<String, List<DepartureSeed>> {
            val rows = parseCsv(content)
            val result = mutableMapOf<String, MutableList<DepartureSeed>>()

            for (row in rows) {
                val stopId = row["stop_id"].orEmpty()
                val tripId = row["trip_id"].orEmpty()
                val departureSeconds = parseGtfsTimeToSeconds(row["departure_time"].orEmpty()) ?: continue
                val trip = tripsById[tripId] ?: continue
                if (stopId.isBlank()) continue

                result.getOrPut(stopId) { mutableListOf() }
                    .add(
                        DepartureSeed(
                            serviceId = trip.serviceId,
                            routeId = trip.routeId,
                            departureSeconds = departureSeconds,
                            destination = trip.destination
                        )
                    )
            }

            return result.mapValues { (_, departures) -> departures.sortedBy { it.departureSeconds } }
        }

        private fun parseCsv(content: String): List<Map<String, String>> {
            val rows = mutableListOf<Map<String, String>>()
            val parsedLines = parseCsvLines(content)
            if (parsedLines.isEmpty()) return emptyList()

            val headers = parsedLines.first().map { it.trim() }
            for (i in 1 until parsedLines.size) {
                val cells = parsedLines[i]
                if (cells.isEmpty()) continue

                val row = buildMap {
                    headers.forEachIndexed { index, header ->
                        put(header, cells.getOrElse(index) { "" }.trim())
                    }
                }
                rows.add(row)
            }

            return rows
        }

        private fun parseCsvLines(content: String): List<List<String>> {
            val rows = mutableListOf<List<String>>()
            val currentRow = mutableListOf<String>()
            val currentField = StringBuilder()
            var inQuotes = false

            var index = 0
            while (index < content.length) {
                val c = content[index]
                when {
                    c == '"' && inQuotes && index + 1 < content.length && content[index + 1] == '"' -> {
                        currentField.append('"')
                        index += 1
                    }
                    c == '"' -> {
                        inQuotes = !inQuotes
                    }
                    c == ',' && !inQuotes -> {
                        currentRow.add(currentField.toString())
                        currentField.clear()
                    }
                    (c == '\n' || c == '\r') && !inQuotes -> {
                        if (c == '\r' && index + 1 < content.length && content[index + 1] == '\n') {
                            index += 1
                        }
                        currentRow.add(currentField.toString())
                        currentField.clear()
                        if (currentRow.any { it.isNotEmpty() }) {
                            rows.add(currentRow.toList())
                        }
                        currentRow.clear()
                    }
                    else -> currentField.append(c)
                }
                index += 1
            }

            if (currentField.isNotEmpty() || currentRow.isNotEmpty()) {
                currentRow.add(currentField.toString())
                if (currentRow.any { it.isNotEmpty() }) {
                    rows.add(currentRow.toList())
                }
            }

            return rows
        }

        private fun parseGtfsTimeToSeconds(value: String): Int? {
            val parts = value.split(':')
            if (parts.size != 3) return null

            val hours = parts[0].toIntOrNull() ?: return null
            val minutes = parts[1].toIntOrNull() ?: return null
            val seconds = parts[2].toIntOrNull() ?: return null
            if (minutes !in 0..59 || seconds !in 0..59 || hours < 0) return null

            return hours * 3600 + minutes * 60 + seconds
        }

        private fun secondsToClock(totalSeconds: Int): String {
            val hours = totalSeconds / 3600
            val minutes = (totalSeconds % 3600) / 60
            val seconds = totalSeconds % 60
            return hours.toString().padStart(2, '0') + ":" +
                minutes.toString().padStart(2, '0') + ":" +
                seconds.toString().padStart(2, '0')
        }

        private fun normalizeForSearch(value: String): String {
            return value
                .lowercase()
                .replace("ae", "a")
                .replace("oe", "o")
                .replace("ue", "u")
                .replace("ss", "s")
                .replace('ä', 'a')
                .replace('ö', 'o')
                .replace('ü', 'u')
                .replace('ß', 's')
                .trim()
        }

        private fun Map<String, String>.requireFile(name: String): String {
            return this[name] ?: error("GTFS file not found: $name")
        }
    }
}

data class StationSearchResult(
    val id: String,
    val name: String,
    val latitude: Double?,
    val longitude: Double?
)

data class DepartureResult(
    val stopId: String,
    val stopName: String,
    val routeName: String,
    val destination: String,
    val departureTime: String,
    val departureSeconds: Int
)

data class GtfsDate(
    val year: Int,
    val month: Int,
    val day: Int
) {
    fun toInt(): Int = year * 10000 + month * 100 + day

    fun dayOfWeekMondayIs1(): Int {
        var y = year
        var m = month
        if (m < 3) {
            m += 12
            y -= 1
        }

        val q = day
        val k = y % 100
        val j = y / 100
        val h = (q + (13 * (m + 1)) / 5 + k + (k / 4) + (j / 4) + (5 * j)) % 7

        return when (h) {
            0 -> 6
            1 -> 7
            2 -> 1
            3 -> 2
            4 -> 3
            5 -> 4
            6 -> 5
            else -> 1
        }
    }
}

private data class SearchIndexEntry(
    val station: StationSearchResult,
    val normalizedName: String
)

private data class SearchScoredEntry(
    val station: StationSearchResult,
    val nameLength: Int,
    val matchType: Int
)

private data class RouteData(
    val id: String,
    val shortName: String,
    val longName: String
)

private data class TripData(
    val tripId: String,
    val routeId: String,
    val serviceId: String,
    val destination: String
)

private data class ServiceCalendar(
    val serviceId: String,
    val monday: Boolean,
    val tuesday: Boolean,
    val wednesday: Boolean,
    val thursday: Boolean,
    val friday: Boolean,
    val saturday: Boolean,
    val sunday: Boolean,
    val startDate: Int,
    val endDate: Int
)

private data class DepartureSeed(
    val serviceId: String,
    val routeId: String,
    val departureSeconds: Int,
    val destination: String
)

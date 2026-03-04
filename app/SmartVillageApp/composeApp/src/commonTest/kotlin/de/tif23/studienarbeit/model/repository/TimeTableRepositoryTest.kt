package de.tif23.studienarbeit.model.repository

import kotlin.test.Test
import kotlin.test.assertEquals

class TimeTableRepositoryTest {

    @Test
    fun searchStations_returnsPrefixMatchesFirst() {
        val repository = TimeTableRepository.fromGtfsTexts(sampleGtfs())

        val result = repository.searchStations("off", limit = 5)

        assertEquals(listOf("Offenburg Hbf", "Offenburg Rathaus"), result.map { it.name })
    }

    @Test
    fun getNextDepartures_returnsOnlyActiveServicesSortedByTime() {
        val repository = TimeTableRepository.fromGtfsTexts(sampleGtfs())

        val departures = repository.getNextDepartures(
            stopId = "STOP_1",
            date = GtfsDate(2026, 3, 4),
            currentTimeSeconds = 13 * 3600 + 55 * 60,
            limit = 10
        )

        assertEquals(listOf("14:05:00", "14:20:00"), departures.map { it.departureTime })
        assertEquals(listOf("RE 2", "ICE 72"), departures.map { it.routeName })
    }

    @Test
    fun getNextDepartures_respectsCalendarDateRemoval() {
        val repository = TimeTableRepository.fromGtfsTexts(sampleGtfs())

        val departures = repository.getNextDepartures(
            stopId = "STOP_1",
            date = GtfsDate(2026, 3, 5),
            currentTimeSeconds = 13 * 3600,
            limit = 10
        )

        assertEquals(listOf("14:20:00"), departures.map { it.departureTime })
        assertEquals(listOf("ICE 72"), departures.map { it.routeName })
    }

    private fun sampleGtfs(): Map<String, String> {
        return mapOf(
            "stops.txt" to """
                stop_id,stop_name,stop_lat,stop_lon
                STOP_1,Offenburg Hbf,48.4735,7.9498
                STOP_2,Offenburg Rathaus,48.4690,7.9440
                STOP_3,Freiburg Hbf,47.9980,7.8410
            """.trimIndent(),
            "routes.txt" to """
                route_id,route_short_name,route_long_name
                ROUTE_RE2,RE 2,Regional Express
                ROUTE_ICE72,ICE 72,Intercity Express
            """.trimIndent(),
            "trips.txt" to """
                route_id,service_id,trip_id,trip_headsign
                ROUTE_RE2,WEEKDAY_RE,TRIP_RE2,Freiburg
                ROUTE_ICE72,WEEKDAY_ICE,TRIP_ICE72,Karlsruhe
            """.trimIndent(),
            "calendar.txt" to """
                service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date
                WEEKDAY_RE,1,1,1,1,1,0,0,20260101,20261231
                WEEKDAY_ICE,1,1,1,1,1,0,0,20260101,20261231
            """.trimIndent(),
            "calendar_dates.txt" to """
                service_id,date,exception_type
                WEEKDAY_RE,20260305,2
            """.trimIndent(),
            "stop_times.txt" to """
                trip_id,arrival_time,departure_time,stop_id,stop_sequence
                TRIP_RE2,14:03:00,14:05:00,STOP_1,1
                TRIP_ICE72,14:18:00,14:20:00,STOP_1,1
            """.trimIndent()
        )
    }
}

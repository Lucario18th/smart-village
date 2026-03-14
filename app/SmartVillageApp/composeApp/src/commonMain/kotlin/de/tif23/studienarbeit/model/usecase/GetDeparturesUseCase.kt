package de.tif23.studienarbeit.model.usecase

import de.tif23.studienarbeit.model.repository.TimeTableRepository
import de.tif23.studienarbeit.model.toDomain
import de.tif23.studienarbeit.viewmodel.data.StationDeparture

class GetDeparturesUseCase() {
    private val repository = TimeTableRepository()

    suspend operator fun invoke(evaNo: String, date: String, hour: String): List<StationDeparture> {
        val station = repository.getPlanTimetable(evaNo, date, hour)
        val filteredDepartures = station.timetableEntry.filter { it.departure != null }
        return filteredDepartures.map { it.toDomain(stationName = station.station) }
    }
}
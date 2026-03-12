package de.tif23.studienarbeit.model.usecase

import de.tif23.studienarbeit.model.repository.TimeTableRepository
import de.tif23.studienarbeit.model.toDomain
import de.tif23.studienarbeit.viewmodel.data.StationDeparture

class GetDeparturesUseCase() {
    private val repository = TimeTableRepository()

    operator suspend fun invoke(evaNo: String, date: String, hour: String): List<StationDeparture> {
        return repository.getPlanTimetable(evaNo, date, hour).s.map { it.toDomain() }

    }
}
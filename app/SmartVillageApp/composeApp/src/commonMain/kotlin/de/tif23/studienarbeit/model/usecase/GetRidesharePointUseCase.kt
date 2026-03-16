package de.tif23.studienarbeit.model.usecase

import de.tif23.studienarbeit.model.repository.SensorRepository
import de.tif23.studienarbeit.model.toDomain
import de.tif23.studienarbeit.viewmodel.data.RidesharePoint

class GetRidesharePointUseCase {
    private val repository = SensorRepository()

    suspend fun getRidesharePoints(villageId: Int): List<RidesharePoint> {
        return repository.getInitialData(villageId).ridesharePoints.map { it.toDomain() }
    }
}
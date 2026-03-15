package de.tif23.studienarbeit.model.usecase

import de.tif23.studienarbeit.model.repository.SensorRepository
import de.tif23.studienarbeit.model.repository.VillagesRepository
import de.tif23.studienarbeit.model.toDomain
import de.tif23.studienarbeit.viewmodel.data.Sensor

class GetSensorDataUseCase {
    private val sensorRepository: SensorRepository = SensorRepository()
    private val villageRepository: VillagesRepository = VillagesRepository()


    suspend fun getInitialSensorData(villageId: Int): List<Sensor> {
        return sensorRepository.getInitialData(villageId).sensors.map { it.toDomain() }
    }

    suspend fun getSensorById(villageId: Int, sensorId: Int): Sensor? {
        return villageRepository.getVillageConfig(villageId).sensors.find { it.id == sensorId }?.toDomain()
    }
}
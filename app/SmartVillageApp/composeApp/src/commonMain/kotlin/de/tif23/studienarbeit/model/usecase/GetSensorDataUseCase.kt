package de.tif23.studienarbeit.model.usecase

import de.tif23.studienarbeit.model.repository.SensorRepository
import de.tif23.studienarbeit.model.toDomain
import de.tif23.studienarbeit.viewmodel.data.Module
import de.tif23.studienarbeit.viewmodel.data.Sensor

class GetSensorDataUseCase {
    private val sensorRepository: SensorRepository = SensorRepository()


    suspend fun getInitialSensorData(villageId: Int): List<Sensor> {
        return sensorRepository.getInitialData(villageId).sensors.map { it.toDomain() }
    }

    suspend fun getSensorById(villageId: Int, sensorId: Int): Sensor? {
        return sensorRepository.getInitialData(villageId).sensors.find { it.sensorId == sensorId }?.toDomain()
    }

    suspend fun getModules(villageId: Int): List<Module> {
        val sensors = sensorRepository.getInitialData(villageId).sensors
        val modules = sensorRepository.getModules(villageId).modules
        return modules.map { it.toDomain(sensors.filter { sensor -> it.sensorIds.contains(sensor.sensorId) }) }
    }
}
package de.tif23.studienarbeit.model.usecase

import de.tif23.studienarbeit.model.repository.SensorRepository
import de.tif23.studienarbeit.model.toDomain
import de.tif23.studienarbeit.viewmodel.data.Message

class GetMessagesUseCase {
    private val sensorRepository = SensorRepository()

    suspend fun getInitialMessages(villageId: Int): List<Message> {
        return sensorRepository.getInitialData(villageId).messages.map { it.toDomain() }
    }
}
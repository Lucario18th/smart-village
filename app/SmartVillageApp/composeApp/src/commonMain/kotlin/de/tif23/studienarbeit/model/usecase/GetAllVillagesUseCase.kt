package de.tif23.studienarbeit.model.usecase

import de.tif23.studienarbeit.model.repository.VillagesRepository
import de.tif23.studienarbeit.model.toDomain
import de.tif23.studienarbeit.viewmodel.data.Village

class GetAllVillagesUseCase {
    private val repository = VillagesRepository()

    suspend operator fun invoke(): List<Village> {
        return repository.getVillages().map { it.toDomain() }
    }
}
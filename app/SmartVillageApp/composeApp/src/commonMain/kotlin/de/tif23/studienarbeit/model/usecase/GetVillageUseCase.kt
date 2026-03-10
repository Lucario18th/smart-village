package de.tif23.studienarbeit.model.usecase

import de.tif23.studienarbeit.model.repository.VillagesRepository
import de.tif23.studienarbeit.model.toDomain
import de.tif23.studienarbeit.viewmodel.data.Village
import de.tif23.studienarbeit.viewmodel.data.VillageConfig

class GetVillageUseCase {
    private val repository = VillagesRepository()

    suspend fun getAllVillages(): List<Village> {
        return repository.getVillages().map { it.toDomain() }
    }

    suspend fun getVillageConfig(id: Int): VillageConfig {
        return repository.getVillageConfig(id).toDomain()
    }
}
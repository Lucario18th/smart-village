package de.tif23.studienarbeit.model.repository

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlin.concurrent.Volatile

object TimeTableRepositoryProvider {
    private val initMutex = Mutex()
    @Volatile
    private var cachedRepository: TimeTableRepository? = null

    suspend fun getRepository(): TimeTableRepository {
        cachedRepository?.let { return it }

        return initMutex.withLock {
            cachedRepository ?: TimeTableRepository.fromComposeResources().also {
                cachedRepository = it
            }
        }
    }
}


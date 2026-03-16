package de.tif23.studienarbeit.provider

import de.tif23.studienarbeit.viewmodel.data.Coordinates
import kotlinx.coroutines.flow.Flow

interface LocationService {
    val locationFlow: Flow<Coordinates>
    suspend fun requestLocationUpdates()
}
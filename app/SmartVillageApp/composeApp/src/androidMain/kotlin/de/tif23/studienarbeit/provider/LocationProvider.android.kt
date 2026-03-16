package de.tif23.studienarbeit.provider

import android.annotation.SuppressLint
import android.content.Context
import android.os.Looper
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import de.tif23.studienarbeit.ContextProvider
import de.tif23.studienarbeit.viewmodel.data.Coordinates
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

class AndroidLocationService(private val context: Context) : LocationService {
    private val client = LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission") // Berechtigungen müssen vorher im UI geprüft werden!
    override val locationFlow: Flow<Coordinates> = callbackFlow {
        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000)
            .setMinUpdateIntervalMillis(2000)
            .build()

        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let {
                    trySend(Coordinates(it.latitude, it.longitude))
                }
            }
        }

        client.requestLocationUpdates(locationRequest, callback, Looper.getMainLooper())
        awaitClose { client.removeLocationUpdates(callback) }
    }

    override suspend fun requestLocationUpdates() {
        // Trigger logic if needed
    }
}

actual fun createLocationService(): LocationService {
   return AndroidLocationService(ContextProvider.getInstance())
}
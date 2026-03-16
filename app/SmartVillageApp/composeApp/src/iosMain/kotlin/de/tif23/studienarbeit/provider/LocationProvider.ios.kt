package de.tif23.studienarbeit.provider

import de.tif23.studienarbeit.viewmodel.data.Coordinates
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.useContents
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import platform.CoreLocation.CLLocation
import platform.CoreLocation.CLLocationManager
import platform.CoreLocation.CLLocationManagerDelegateProtocol
import platform.CoreLocation.kCLLocationAccuracyBest
import platform.Foundation.NSError
import platform.darwin.NSObject

class IosLocationService : LocationService {
    private val locationManager = CLLocationManager()

    @OptIn(ExperimentalForeignApi::class)
    override val locationFlow: Flow<Coordinates> = callbackFlow {
        val delegate = object : NSObject(), CLLocationManagerDelegateProtocol {
            override fun locationManager(manager: CLLocationManager, didUpdateLocations: List<*>) {
                val location = didUpdateLocations.lastOrNull() as? CLLocation
                location?.let {
                    it.coordinate.useContents {
                        trySend(Coordinates(latitude, longitude))
                    }
                }
            }

            override fun locationManager(manager: CLLocationManager, didFailWithError: NSError) {
                // Handle error
            }

            override fun locationManagerDidChangeAuthorization(manager: CLLocationManager) {
                // Handle auth changes
            }
        }

        locationManager.delegate = delegate
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()

        awaitClose {
            locationManager.stopUpdatingLocation()
        }
    }

    override suspend fun requestLocationUpdates() {
        // Trigger logic
    }
}

actual fun createLocationService(): LocationService = IosLocationService()
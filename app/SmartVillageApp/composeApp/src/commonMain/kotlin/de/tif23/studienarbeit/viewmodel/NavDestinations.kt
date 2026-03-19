package de.tif23.studienarbeit.viewmodel

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable
object NavDestinations {
    @Serializable
    data object MainScreen : NavKey

    @Serializable
    data object MapScreen : NavKey

    @Serializable
    data object MobilityScreen : NavKey

    @Serializable
    data object SensorScreen : NavKey

    @Serializable
    data class SensorDetailScreen(val sensorId: Int) : NavKey

    @Serializable
    data object ModulesScreen : NavKey

    @Serializable
    data object SettingsScreen : NavKey

    @Serializable
    data class MessagesScreen(
        val villageId: Int
    ) : NavKey

    @Serializable
    data class RideDetailsScreen(val rideId: String) : NavKey

    @Serializable
    data class RidesharePointDetailScreen(
        val pointId: Int,
        val name: String,
        val description: String,
        val personCount: Int,
        val maxCapacity: Int,
        val latitude: Double,
        val longitude: Double
    ) : NavKey

    @Serializable
    data object RideOfferScreen : NavKey

    @Serializable
    data class StationScreen(
        val stationEvaNo: String,
    ) : NavKey

    @Serializable
    data object SplashScreen : NavKey
}

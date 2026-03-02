package de.tif23.studienarbeit.viewmodel

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable
object NavDestinations {
    @Serializable
    data object MainScreen : NavKey

    @Serializable
    data object MobilityScreen : NavKey

    @Serializable
    data object SensorScreen : NavKey

    @Serializable
    data object PinboardScreen : NavKey

    @Serializable
    data object SettingsScreen : NavKey

    @Serializable
    data object NotificationsScreen : NavKey

    @Serializable
    data class RideDetailsScreen(val rideId: String) : NavKey

    @Serializable
    data object RideOfferScreen : NavKey

    @Serializable
    data object StationScreen : NavKey
}


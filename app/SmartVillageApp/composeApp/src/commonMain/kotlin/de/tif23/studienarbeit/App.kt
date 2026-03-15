package de.tif23.studienarbeit

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import androidx.savedstate.serialization.SavedStateConfiguration
import de.tif23.studienarbeit.model.repository.SelectedVillageSettingsStore
import de.tif23.studienarbeit.ui.screens.MainScreen
import de.tif23.studienarbeit.ui.screens.MapScreen
import de.tif23.studienarbeit.ui.screens.MobilityScreen
import de.tif23.studienarbeit.ui.screens.RideDetailsScreen
import de.tif23.studienarbeit.ui.screens.RideOfferScreen
import de.tif23.studienarbeit.ui.screens.RidesharePointDetailScreen
import de.tif23.studienarbeit.ui.screens.SensorDetailScreen
import de.tif23.studienarbeit.ui.screens.SensorsScreen
import de.tif23.studienarbeit.ui.screens.SettingsScreen
import de.tif23.studienarbeit.ui.screens.SplashScreen
import de.tif23.studienarbeit.ui.screens.StationDeparturesScreen
import de.tif23.studienarbeit.ui.theme.SmartVillageTheme
import de.tif23.studienarbeit.viewmodel.NavDestinations
import de.tif23.studienarbeit.viewmodel.StationDeparturesViewModel
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.polymorphic

private val config = SavedStateConfiguration {
    serializersModule = SerializersModule {
        polymorphic(NavKey::class) {
            subclass(NavDestinations.MainScreen::class, NavDestinations.MainScreen.serializer())
            subclass(NavDestinations.MapScreen::class, NavDestinations.MapScreen.serializer())
            subclass(NavDestinations.MobilityScreen::class, NavDestinations.MobilityScreen.serializer())
            subclass(NavDestinations.SensorScreen::class, NavDestinations.SensorScreen.serializer())
            subclass(NavDestinations.SensorDetailScreen::class, NavDestinations.SensorDetailScreen.serializer())
            subclass(NavDestinations.PinboardScreen::class, NavDestinations.PinboardScreen.serializer())
            subclass(NavDestinations.SettingsScreen::class, NavDestinations.SettingsScreen.serializer())
            subclass(NavDestinations.NotificationsScreen::class, NavDestinations.NotificationsScreen.serializer())
            subclass(NavDestinations.RideDetailsScreen::class, NavDestinations.RideDetailsScreen.serializer())
            subclass(NavDestinations.RidesharePointDetailScreen::class, NavDestinations.RidesharePointDetailScreen.serializer())
            subclass(NavDestinations.RideOfferScreen::class, NavDestinations.RideOfferScreen.serializer())
            subclass(NavDestinations.StationScreen::class, NavDestinations.StationScreen.serializer())
            subclass(NavDestinations.SplashScreen::class, NavDestinations.SplashScreen.serializer())
        }
    }
}

@Composable
fun App() {
    val selectedVillageSettingsStore = remember { SelectedVillageSettingsStore() }
    val hasSelectedVillage = remember {
        selectedVillageSettingsStore.getSelectedVillageId() != null
    }
    val startDestination = if (hasSelectedVillage) {
        NavDestinations.MainScreen
    } else {
        NavDestinations.SplashScreen
    }
    val backStack = rememberNavBackStack(config, startDestination)

    SmartVillageTheme {
        NavDisplay(
            backStack = backStack,
            onBack = { backStack.removeLastOrNull() },
            entryDecorators = listOf(
                rememberSaveableStateHolderNavEntryDecorator(),
                rememberViewModelStoreNavEntryDecorator()
            ),
            entryProvider = entryProvider {
                entry<NavDestinations.MainScreen> {
                    MainScreen(backStack = backStack)
                }

                entry<NavDestinations.MapScreen> {
                    MapScreen(backStack = backStack)
                }

                entry<NavDestinations.MobilityScreen> {
                    MobilityScreen(backStack)
                }

                entry<NavDestinations.SensorScreen> {
                    SensorsScreen(backStack)
                }

                entry<NavDestinations.SensorDetailScreen> { sensorDetailScreen ->
                    SensorDetailScreen(
                        sensorId = sensorDetailScreen.sensorId,
                        backStack = backStack
                    )
                }

                entry<NavDestinations.PinboardScreen> {

                }

                entry<NavDestinations.SettingsScreen> {
                    SettingsScreen(backStack = backStack)
                }

                entry<NavDestinations.NotificationsScreen> {

                }

                entry<NavDestinations.RideDetailsScreen> {
                    RideDetailsScreen(backStack)
                }

                entry<NavDestinations.RidesharePointDetailScreen> { ridesharePointDetailScreen ->
                    RidesharePointDetailScreen(
                        name = ridesharePointDetailScreen.name,
                        description = ridesharePointDetailScreen.description,
                        personCount = ridesharePointDetailScreen.personCount,
                        maxCapacity = ridesharePointDetailScreen.maxCapacity,
                        latitude = ridesharePointDetailScreen.latitude,
                        longitude = ridesharePointDetailScreen.longitude
                    )
                }

                entry<NavDestinations.RideOfferScreen> {
                    RideOfferScreen(backStack)
                }

                entry<NavDestinations.StationScreen> { stationEvaNo ->
                    StationDeparturesScreen(
                        backStack = backStack,
                        viewModel = viewModel(factory = StationDeparturesViewModel.Factory(stationEvaNo))
                    )
                }

                entry<NavDestinations.SplashScreen> {
                    SplashScreen(backStack)
                }
            }
        )
    }
}
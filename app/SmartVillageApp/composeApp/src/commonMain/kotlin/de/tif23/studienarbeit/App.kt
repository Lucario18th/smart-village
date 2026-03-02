package de.tif23.studienarbeit

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import androidx.savedstate.serialization.SavedStateConfiguration
import de.tif23.studienarbeit.ui.screens.MainScreen
import de.tif23.studienarbeit.ui.screens.MobilityScreen
import de.tif23.studienarbeit.ui.theme.SmartVillageTheme
import de.tif23.studienarbeit.viewmodel.NavDestinations
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.polymorphic

private val config = SavedStateConfiguration {
    serializersModule = SerializersModule {
        polymorphic(NavKey::class) {
            subclass(NavDestinations.MainScreen::class, NavDestinations.MainScreen.serializer())
            subclass(NavDestinations.MobilityScreen::class, NavDestinations.MobilityScreen.serializer())
            subclass(NavDestinations.SensorScreen::class, NavDestinations.SensorScreen.serializer())
            subclass(NavDestinations.PinboardScreen::class, NavDestinations.PinboardScreen.serializer())
            subclass(NavDestinations.SettingsScreen::class, NavDestinations.SettingsScreen.serializer())
            subclass(NavDestinations.NotificationsScreen::class, NavDestinations.NotificationsScreen.serializer())
        }
    }
}

@Composable
fun App() {
    val backStack = rememberNavBackStack(config, NavDestinations.MainScreen)

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

                entry<NavDestinations.MobilityScreen> {
                    MobilityScreen(backStack)
                }

                entry<NavDestinations.SensorScreen> {

                }

                entry<NavDestinations.PinboardScreen> {

                }

                entry<NavDestinations.SettingsScreen> {

                }

                entry<NavDestinations.NotificationsScreen> {

                }
            }
        )
    }
}
package de.tif23.studienarbeit.ui.components

import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.runtime.Composable
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import de.tif23.studienarbeit.util.NavBarTabs
import de.tif23.studienarbeit.viewmodel.NavDestinations
import org.jetbrains.compose.resources.painterResource
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.commute
import smartvillageapp.composeapp.generated.resources.home
import smartvillageapp.composeapp.generated.resources.modules
import smartvillageapp.composeapp.generated.resources.settings
import smartvillageapp.composeapp.generated.resources.thermometer

@Composable
fun NavBar(backStack: NavBackStack<NavKey>, currentTab: NavBarTabs) {
    NavigationBar {
        NavigationBarItem(
            selected = currentTab == NavBarTabs.MAIN,
            onClick = { backStack.add(NavDestinations.MainScreen) },
            icon = { Icon(painterResource(Res.drawable.home), contentDescription = "Home") },
        )
        NavigationBarItem(
            selected = currentTab == NavBarTabs.MOBILITY,
            onClick = { backStack.add(NavDestinations.MobilityScreen) },
            icon = { Icon(painterResource(Res.drawable.commute), contentDescription = "Karte") },
        )
        NavigationBarItem(
            selected = currentTab == NavBarTabs.SENSORS,
            onClick = { backStack.add(NavDestinations.SensorScreen) },
            icon = {
                Icon(
                    painterResource(Res.drawable.thermometer),
                    contentDescription = "Sensoren"
                )
            },
        )
        NavigationBarItem(
            selected = currentTab == NavBarTabs.MODULES,
            onClick = { backStack.add(NavDestinations.ModulesScreen) },
            icon = {
                Icon(
                    painterResource(Res.drawable.modules),
                    contentDescription = "Module"
                )
            },
        )
        NavigationBarItem(
            selected = currentTab == NavBarTabs.SETTINGS,
            onClick = {
                if (currentTab != NavBarTabs.SETTINGS) {
                    backStack.add(NavDestinations.SettingsScreen)
                }
            },
            icon = {
                Icon(
                    painterResource(Res.drawable.settings),
                    contentDescription = "Einstellungen"
                )
            },
        )
    }
}
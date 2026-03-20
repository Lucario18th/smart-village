package de.tif23.studienarbeit.viewmodel.data

import org.jetbrains.compose.resources.DrawableResource
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.altglas_location
import smartvillageapp.composeapp.generated.resources.bolt
import smartvillageapp.composeapp.generated.resources.camera
import smartvillageapp.composeapp.generated.resources.event
import smartvillageapp.composeapp.generated.resources.mail
import smartvillageapp.composeapp.generated.resources.map
import smartvillageapp.composeapp.generated.resources.sensor
import smartvillageapp.composeapp.generated.resources.transportation
import smartvillageapp.composeapp.generated.resources.trees
import smartvillageapp.composeapp.generated.resources.water
import smartvillageapp.composeapp.generated.resources.weather_filled

enum class ModuleIcon(val drawableResource: DrawableResource) {
    SENSOR(Res.drawable.sensor),
    WEATHER(Res.drawable.weather_filled),
    MESSAGES(Res.drawable.mail),
    MAP(Res.drawable.map),
    MOBILITY(Res.drawable.transportation),
    EVENTS(Res.drawable.event),
    CONTAINER(Res.drawable.altglas_location),
    TREES(Res.drawable.trees),
    WATER(Res.drawable.water),
    CAMERA(Res.drawable.camera),
    ENERGY(drawableResource = Res.drawable.bolt)
}
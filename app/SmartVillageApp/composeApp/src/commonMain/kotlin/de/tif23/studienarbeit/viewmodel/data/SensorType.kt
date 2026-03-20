package de.tif23.studienarbeit.viewmodel.data

import org.jetbrains.compose.resources.DrawableResource
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.air
import smartvillageapp.composeapp.generated.resources.air_pressure
import smartvillageapp.composeapp.generated.resources.co2
import smartvillageapp.composeapp.generated.resources.humidity_percentage
import smartvillageapp.composeapp.generated.resources.parkbank_location
import smartvillageapp.composeapp.generated.resources.rain
import smartvillageapp.composeapp.generated.resources.soil_humidity
import smartvillageapp.composeapp.generated.resources.sun_radiation
import smartvillageapp.composeapp.generated.resources.thermometer

enum class SensorType(val drawableResource: DrawableResource) {
    CO2(Res.drawable.co2),
    AIR_HUMIDITY(Res.drawable.humidity_percentage),
    RIDESHARE(Res.drawable.parkbank_location),
    AIR_PRESSURE(Res.drawable.air_pressure),
    RAIN(Res.drawable.rain),
    SOIL_HUMIDITY(Res.drawable.soil_humidity),
    SOLAR_RADIATION(Res.drawable.sun_radiation),
    TEMPERATURE(Res.drawable.thermometer),
    WIND_SPEED(Res.drawable.air)
}
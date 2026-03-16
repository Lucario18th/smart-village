package de.tif23.studienarbeit.util

import kotlin.math.PI
import kotlin.math.ln
import kotlin.math.tan

fun latToY(lat: Double): Double {
    val latRad = lat * PI / 180
    return (1 - ln(tan(PI / 4 + latRad / 2)) / PI) / 2
}

fun lonToX(lon: Double): Double {
    return (lon + 180) / 360
}
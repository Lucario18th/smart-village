package de.tif23.studienarbeit.viewmodel

import androidx.lifecycle.ViewModel
import de.tif23.studienarbeit.provider.makeOsmTileStreamProvider
import ovh.plrapps.mapcompose.api.addLayer
import ovh.plrapps.mapcompose.api.enableRotation
import ovh.plrapps.mapcompose.api.scale
import ovh.plrapps.mapcompose.core.TileStreamProvider
import ovh.plrapps.mapcompose.ui.layout.Forced
import ovh.plrapps.mapcompose.ui.state.MapState
import kotlin.math.PI
import kotlin.math.ln
import kotlin.math.pow
import kotlin.math.tan

class MainViewModel: ViewModel() {
    val tileStreamProvider = makeOsmTileStreamProvider()
    private val maxLevel = 16
    private val minLevel = 12
    private val mapSize = mapSizeAtLevel(maxLevel, tileSize = 256)

    val lonCoordinate = 7.66707
    val latCoordinate = 47.61379
    val latRad = latCoordinate * PI / 180
    val lon = (lonCoordinate + 180) / 360
    val lat = (1 - ln(tan(PI / 4 + latRad / 2)) / PI) / 2

    val state = MapState(levelCount = maxLevel + 1, mapSize, mapSize, workerCount = 16) {
        minimumScaleMode(Forced(1 / 2.0.pow(maxLevel - minLevel)))
        scroll(lon, lat)  // Paris
    }.apply {
        addLayer(tileStreamProvider)
        scale = 1.0 // to zoom out initially
    }

    private fun mapSizeAtLevel(wmtsLevel: Int, tileSize: Int): Int {
        return tileSize * 2.0.pow(wmtsLevel).toInt()
    }
}
package de.tif23.studienarbeit.viewmodel

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.DpOffset
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import de.tif23.studienarbeit.provider.makeOsmTileStreamProvider
import de.tif23.studienarbeit.util.latToY
import de.tif23.studienarbeit.util.lonToX
import de.tif23.studienarbeit.viewmodel.constants.LOERRACH_LAT
import de.tif23.studienarbeit.viewmodel.constants.LOERRACH_LON
import org.jetbrains.compose.resources.painterResource
import ovh.plrapps.mapcompose.api.addCallout
import ovh.plrapps.mapcompose.api.addLayer
import ovh.plrapps.mapcompose.api.addMarker
import ovh.plrapps.mapcompose.api.onMarkerClick
import ovh.plrapps.mapcompose.api.scale
import ovh.plrapps.mapcompose.ui.layout.Forced
import ovh.plrapps.mapcompose.ui.state.MapState
import smartvillageapp.composeapp.generated.resources.Res
import smartvillageapp.composeapp.generated.resources.add_location
import kotlin.math.PI
import kotlin.math.ln
import kotlin.math.pow
import kotlin.math.tan

class MainViewModel: ViewModel() {
    private val tileStreamProvider = makeOsmTileStreamProvider()
    private val maxLevel = 16
    private val minLevel = 12
    private val mapSize = mapSizeAtLevel(maxLevel, tileSize = 256)

    val mapState = MapState(levelCount = maxLevel + 1, mapSize, mapSize, workerCount = 16) {
        minimumScaleMode(Forced(1 / 2.0.pow(maxLevel - minLevel)))
        scroll(lonToX(LOERRACH_LON), latToY(LOERRACH_LAT))  // Paris
    }.apply {
        addLayer(tileStreamProvider)
        addMarker("altglas1", lonToX(7.6588259), latToY(47.6158539)) {
            Icon(
                painter = painterResource(Res.drawable.add_location),
                contentDescription = null,
                modifier = Modifier.size(24.dp),
                tint = MaterialTheme.colorScheme.primary
            )
        }
        addMarker("altglas2", lonToX(7.6625086), latToY(47.6020404)) {
            Icon(
                painter = painterResource(Res.drawable.add_location),
                contentDescription = null,
                modifier = Modifier.size(24.dp),
                tint = MaterialTheme.colorScheme.primary
            )
        }
        scale = 1.0 // to zoom out initially

        onMarkerClick { id, x, y ->
            var shouldAnimate by mutableStateOf(true)
            addCallout(
                id, x, y,
                absoluteOffset = DpOffset(0.dp, (-50).dp),
                autoDismiss = true

            ) {
                Text(
                    text = "Marker $id with coordinates ($x, $y)",
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.background(MaterialTheme.colorScheme.surface)
                )
            }
        }
    }

    private fun mapSizeAtLevel(wmtsLevel: Int, tileSize: Int): Int {
        return tileSize * 2.0.pow(wmtsLevel).toInt()
    }
}
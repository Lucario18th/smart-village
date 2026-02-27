package de.tif23.studienarbeit.provider

import de.tif23.studienarbeit.util.getKtorClient
import de.tif23.studienarbeit.util.readBuffer
import ovh.plrapps.mapcompose.core.TileStreamProvider

actual fun makeOsmTileStreamProvider(): TileStreamProvider {
    val httpClient = getKtorClient()
    return TileStreamProvider { row, col, zoomLvl ->
        try {
            readBuffer(httpClient, "https://tile.openstreetmap.org/$zoomLvl/$col/$row.png")
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}

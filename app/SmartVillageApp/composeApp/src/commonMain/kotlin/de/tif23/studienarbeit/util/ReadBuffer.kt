package de.tif23.studienarbeit.util

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.prepareGet
import io.ktor.utils.io.ByteReadChannel
import io.ktor.utils.io.readBuffer
import kotlinx.io.RawSource

suspend fun readBuffer(client: HttpClient, path: String): RawSource {
    return client.prepareGet(path).execute { httpResponse ->
        val channel: ByteReadChannel = httpResponse.body()
        channel.readBuffer()
    }
}
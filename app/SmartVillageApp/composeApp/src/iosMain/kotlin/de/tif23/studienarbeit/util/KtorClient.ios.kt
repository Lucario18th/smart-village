package de.tif23.studienarbeit.util

import io.ktor.client.HttpClient
import io.ktor.client.engine.darwin.Darwin
import io.ktor.client.plugins.BrowserUserAgent

actual fun getKtorClient(): HttpClient {
    return HttpClient(Darwin) {
        BrowserUserAgent()
        engine {
            configureRequest {
                setAllowsCellularAccess(true)
            }
        }
    }
}
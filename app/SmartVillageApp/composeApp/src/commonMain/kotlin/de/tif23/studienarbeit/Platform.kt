package de.tif23.studienarbeit

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform
package de.tif23.studienarbeit.util

import platform.UIKit.UIDevice

class IOSPlatform : Platform {
    override val name: String = "iOS"
    override val version: String = UIDevice.currentDevice.systemName() + " " + UIDevice.currentDevice.systemVersion
}

actual fun getPlatform(): Platform = IOSPlatform()
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.util.zip.ZipFile

val gtfsZipFile = layout.projectDirectory.file("src/commonMain/composeResources/files/bwgesamt.zip")
val gtfsCompactResourcesDir = layout.projectDirectory.dir("src/commonMain/composeResources/files/gtfs_compact")

private data class StopRow(
    val stopId: String,
    val stopName: String,
    val parentStation: String
)

private fun parseCsvLine(line: String): List<String> {
    val result = mutableListOf<String>()
    val field = StringBuilder()
    var inQuotes = false
    var index = 0
    while (index < line.length) {
        val c = line[index]
        when {
            c == '"' && inQuotes && index + 1 < line.length && line[index + 1] == '"' -> {
                field.append('"')
                index += 1
            }
            c == '"' -> inQuotes = !inQuotes
            c == ',' && !inQuotes -> {
                result.add(field.toString())
                field.setLength(0)
            }
            else -> field.append(c)
        }
        index += 1
    }
    result.add(field.toString())
    return result
}

private fun extractHeaders(headerLine: String): Map<String, Int> {
    return parseCsvLine(headerLine).mapIndexed { idx, name -> name.trim() to idx }.toMap()
}

private fun readZipEntryLines(zip: ZipFile, entryName: String): Sequence<String> {
    val entry = zip.getEntry(entryName) ?: error("GTFS entry not found in zip: $entryName")
    return zip.getInputStream(entry).bufferedReader(Charsets.UTF_8).lineSequence()
}

val extractGtfsResources by tasks.registering {
    description = "Generate filtered GTFS resources from bwgesamt.zip for commonMain"
    group = "build"
    notCompatibleWithConfigurationCache("Uses script-level CSV parsing during resource generation")

    inputs.file(gtfsZipFile)
    outputs.dir(gtfsCompactResourcesDir)

    doLast {
        val outputDir = gtfsCompactResourcesDir.asFile
        outputDir.mkdirs()
        outputDir.listFiles()?.forEach { if (it.isFile) it.delete() }

        val wantedStationStopIdPrefixes = setOf("de:08336:6600", "de:08336:3603")

        ZipFile(gtfsZipFile.asFile).use { zip ->
            val stopsLines = readZipEntryLines(zip, "stops.txt").toList()
            if (stopsLines.isEmpty()) error("stops.txt is empty")

            val stopsHeader = stopsLines.first()
            val stopHeaders = extractHeaders(stopsHeader)
            val stopIdIdx = stopHeaders["stop_id"] ?: error("stop_id missing in stops.txt")
            val stopNameIdx = stopHeaders["stop_name"] ?: error("stop_name missing in stops.txt")
            val parentIdx = stopHeaders["parent_station"]

            val parsedStops = stopsLines.drop(1)
                .asSequence()
                .map { parseCsvLine(it) }
                .filter { it.size > stopNameIdx && it.size > stopIdIdx }
                .map { cells ->
                    StopRow(
                        stopId = cells.getOrElse(stopIdIdx) { "" },
                        stopName = cells.getOrElse(stopNameIdx) { "" },
                        parentStation = parentIdx?.let { idx -> cells.getOrElse(idx) { "" } }.orEmpty()
                    )
                }
                .filter { it.stopId.isNotBlank() }
                .toList()

            val selectedStops = parsedStops.filter { stop ->
                wantedStationStopIdPrefixes.any { prefix -> stop.stopId.startsWith(prefix) }
            }

            val selectedStopIds = selectedStops.map { it.stopId }.toMutableSet()
            val selectedParentIds = selectedStops.mapNotNull { it.parentStation.takeIf(String::isNotBlank) }.toSet()

            parsedStops
                .filter { it.parentStation in selectedParentIds }
                .forEach { selectedStopIds.add(it.stopId) }
            selectedParentIds.forEach { selectedStopIds.add(it) }

            if (selectedStopIds.isEmpty()) {
                error("No station stop_ids selected. Check station names in build.gradle.kts")
            }

            File(outputDir, "stops.txt").writeText(stopsLines.joinToString("\n"), Charsets.UTF_8)

            val stopTimesFile = File(outputDir, "stop_times.txt")
            val usedTripIds = mutableSetOf<String>()
            stopTimesFile.bufferedWriter(Charsets.UTF_8).use { writer ->
                val iterator = readZipEntryLines(zip, "stop_times.txt").iterator()
                if (!iterator.hasNext()) error("stop_times.txt is empty")
                val header = iterator.next()
                writer.appendLine(header)
                val headers = extractHeaders(header)
                val stopId = headers["stop_id"] ?: error("stop_id missing in stop_times.txt")
                val tripId = headers["trip_id"] ?: error("trip_id missing in stop_times.txt")

                while (iterator.hasNext()) {
                    val line = iterator.next()
                    val cells = parseCsvLine(line)
                    val sid = cells.getOrElse(stopId) { "" }
                    if (sid !in selectedStopIds) continue
                    val tid = cells.getOrElse(tripId) { "" }
                    if (tid.isBlank()) continue
                    usedTripIds.add(tid)
                    writer.appendLine(line)
                }
            }

            val usedRouteIds = mutableSetOf<String>()
            val usedServiceIds = mutableSetOf<String>()
            File(outputDir, "trips.txt").bufferedWriter(Charsets.UTF_8).use { writer ->
                val iterator = readZipEntryLines(zip, "trips.txt").iterator()
                if (!iterator.hasNext()) error("trips.txt is empty")
                val header = iterator.next()
                writer.appendLine(header)
                val headers = extractHeaders(header)
                val tripId = headers["trip_id"] ?: error("trip_id missing in trips.txt")
                val routeId = headers["route_id"] ?: error("route_id missing in trips.txt")
                val serviceId = headers["service_id"] ?: error("service_id missing in trips.txt")

                while (iterator.hasNext()) {
                    val line = iterator.next()
                    val cells = parseCsvLine(line)
                    val tid = cells.getOrElse(tripId) { "" }
                    if (tid !in usedTripIds) continue
                    val rid = cells.getOrElse(routeId) { "" }
                    val sid = cells.getOrElse(serviceId) { "" }
                    if (rid.isNotBlank()) usedRouteIds.add(rid)
                    if (sid.isNotBlank()) usedServiceIds.add(sid)
                    writer.appendLine(line)
                }
            }

            File(outputDir, "routes.txt").bufferedWriter(Charsets.UTF_8).use { writer ->
                val iterator = readZipEntryLines(zip, "routes.txt").iterator()
                if (!iterator.hasNext()) error("routes.txt is empty")
                val header = iterator.next()
                writer.appendLine(header)
                val headers = extractHeaders(header)
                val routeId = headers["route_id"] ?: error("route_id missing in routes.txt")

                while (iterator.hasNext()) {
                    val line = iterator.next()
                    val cells = parseCsvLine(line)
                    if (cells.getOrElse(routeId) { "" } in usedRouteIds) {
                        writer.appendLine(line)
                    }
                }
            }

            File(outputDir, "calendar.txt").bufferedWriter(Charsets.UTF_8).use { writer ->
                val iterator = readZipEntryLines(zip, "calendar.txt").iterator()
                if (!iterator.hasNext()) error("calendar.txt is empty")
                val header = iterator.next()
                writer.appendLine(header)
                val headers = extractHeaders(header)
                val serviceId = headers["service_id"] ?: error("service_id missing in calendar.txt")

                while (iterator.hasNext()) {
                    val line = iterator.next()
                    val cells = parseCsvLine(line)
                    if (cells.getOrElse(serviceId) { "" } in usedServiceIds) {
                        writer.appendLine(line)
                    }
                }
            }

            File(outputDir, "calendar_dates.txt").bufferedWriter(Charsets.UTF_8).use { writer ->
                val iterator = readZipEntryLines(zip, "calendar_dates.txt").iterator()
                if (!iterator.hasNext()) error("calendar_dates.txt is empty")
                val header = iterator.next()
                writer.appendLine(header)
                val headers = extractHeaders(header)
                val serviceId = headers["service_id"] ?: error("service_id missing in calendar_dates.txt")

                while (iterator.hasNext()) {
                    val line = iterator.next()
                    val cells = parseCsvLine(line)
                    if (cells.getOrElse(serviceId) { "" } in usedServiceIds) {
                        writer.appendLine(line)
                    }
                }
            }
        }
    }
}

tasks.configureEach {
    if (
        name != extractGtfsResources.name &&
        (name.contains("compose", ignoreCase = true) || name.contains("resources", ignoreCase = true))
    ) {
        dependsOn(extractGtfsResources)
    }
}

plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
    alias(libs.plugins.kotlinSerialization)
}

kotlin {
    androidTarget {
        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_11)
        }
    }
    
    listOf(
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "ComposeApp"
            isStatic = true
        }
    }
    
    sourceSets {
        androidMain.dependencies {
            implementation(libs.compose.uiToolingPreview)
            implementation(libs.androidx.activity.compose)
            implementation(libs.ktor.client.android)
        }
        iosMain.dependencies {
            implementation(libs.ktor.client.darwin)
        }
        commonMain {
            dependencies {
                implementation(libs.compose.runtime)
                implementation(libs.compose.foundation)
                implementation(libs.compose.material3)
                implementation(libs.compose.ui)
                implementation(libs.compose.components.resources)
                implementation(libs.compose.uiToolingPreview)
                implementation(libs.androidx.lifecycle.viewmodelCompose)
                implementation(libs.androidx.lifecycle.runtimeCompose)
                implementation(libs.mapcompose.mp)
                implementation(libs.ktor.client.core)
                implementation(libs.kotlinx.serialization.json)
                implementation(libs.jetbrains.navigation3.ui)
                implementation(libs.jetbrains.material3.adaptiveNavigation3)
                implementation(libs.jetbrains.lifecycle.viewmodelNavigation3)
            }
        }
        commonTest.dependencies {
            implementation(libs.kotlin.test)
        }
    }
}

android {
    namespace = "de.tif23.studienarbeit"
    compileSdk = libs.versions.android.compileSdk.get().toInt()

    defaultConfig {
        applicationId = "de.tif23.studienarbeit"
        minSdk = libs.versions.android.minSdk.get().toInt()
        targetSdk = libs.versions.android.targetSdk.get().toInt()
        versionCode = 1
        versionName = "1.0"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    debugImplementation(libs.compose.uiTooling)
}

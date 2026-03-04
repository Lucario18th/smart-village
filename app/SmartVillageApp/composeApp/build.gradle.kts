import org.jetbrains.kotlin.gradle.dsl.JvmTarget

val gtfsZipFile = layout.projectDirectory.file("src/commonMain/composeResources/files/bwgesamt.zip")
val generatedGtfsResourcesDir = layout.buildDirectory.dir("generated/gtfsResources/commonMain")

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
            resources.srcDir(generatedGtfsResourcesDir)
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

val extractGtfsResources by tasks.registering(Copy::class) {
    description = "Extract GTFS text files from bwgesamt.zip into generated commonMain resources"
    group = "build"

    from(zipTree(gtfsZipFile)) {
        include(
            "stops.txt",
            "routes.txt",
            "trips.txt",
            "stop_times.txt",
            "calendar.txt",
            "calendar_dates.txt"
        )
    }
    into(generatedGtfsResourcesDir.map { it.dir("files/gtfs") })
}

tasks.configureEach {
    if (
        name != extractGtfsResources.name &&
        (name.contains("compose", ignoreCase = true) || name.contains("resources", ignoreCase = true))
    ) {
        dependsOn(extractGtfsResources)
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

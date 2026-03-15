package de.tif23.studienarbeit.ui.components

import androidx.compose.runtime.Composable

@Composable
expect fun RequestLocationPermission(onGranted:() -> Unit)
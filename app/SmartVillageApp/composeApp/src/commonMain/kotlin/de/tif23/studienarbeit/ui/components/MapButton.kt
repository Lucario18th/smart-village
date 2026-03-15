package de.tif23.studienarbeit.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.jetbrains.compose.resources.DrawableResource
import org.jetbrains.compose.resources.painterResource

@Composable
fun MapButton(icon: DrawableResource, contentDescription: String?, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = MaterialTheme.colorScheme.primaryContainer,
        border = BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.primary
        ),
        modifier = Modifier
            .padding(8.dp)
            .clickable { onClick() }
    ) {
        Icon(
            painter = painterResource(icon),
            contentDescription = contentDescription,
            modifier = Modifier.padding(4.dp),
            tint = MaterialTheme.colorScheme.onPrimaryContainer
        )
    }
}
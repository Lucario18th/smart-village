package de.tif23.studienarbeit.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import de.tif23.studienarbeit.viewmodel.data.StationDeparture
import de.tif23.studienarbeit.viewmodel.data.TripStatus
import kotlinx.datetime.LocalDateTime

@Composable
fun DepartureRow(departure: StationDeparture) {
    val changedLine = departure.changedLine?.takeIf { it.isNotBlank() && it != departure.line }
    val changedDestination = departure.changedDestination?.takeIf {
        it.isNotBlank() && it != departure.destination
    }
    val changedStops = departure.changedStops?.takeIf { it.isNotEmpty() && it != departure.stops }
    val changedPlatform = departure.changedPlatform?.takeIf { it.isNotBlank() && it != departure.platform }
    val changedDeparture = departure.changedDeparture?.takeIf { it != departure.departure }
    val plannedStops = departure.stops.takeIf { it.isNotEmpty() }?.let { formatStops(it) }
    val changedStopsLabel = changedStops?.let { formatStops(it) }
    val statusLabel = formatTripStatusLabel(departure.status)

    val plannedHeadline = "${departure.line} - ${departure.destination}"
    val changedHeadline = if (changedLine != null || changedDestination != null) {
        "${changedLine ?: departure.line} - ${changedDestination ?: departure.destination}"
    } else {
        null
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            DeviationAwareText(
                plannedValue = plannedHeadline,
                changedValue = changedHeadline,
                style = MaterialTheme.typography.bodyMedium,
                unchangedFontWeight = FontWeight.SemiBold,
                changedFontWeight = FontWeight.SemiBold
            )

            DeviationAwareText(
                plannedValue = "Gleis ${departure.platform}",
                changedValue = changedPlatform?.let { "Gleis $it" },
                style = MaterialTheme.typography.bodySmall,
                unchangedColor = MaterialTheme.colorScheme.primary,
                unchangedFontWeight = FontWeight.Medium,
                plannedChangedColor = MaterialTheme.colorScheme.primary
            )

            plannedStops?.let {
                DeviationAwareText(
                    plannedValue = "über $it",
                    changedValue = changedStopsLabel,
                    style = MaterialTheme.typography.bodySmall,
                    unchangedColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    plannedChangedColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    isTrainPath = true
                )
            }
        }
        Spacer(modifier = Modifier.width(12.dp))

        Column(horizontalAlignment = Alignment.End) {
            DeviationAwareText(
                plannedValue = formatTime(departure.departure),
                changedValue = changedDeparture?.let { formatTime(it) },
                style = MaterialTheme.typography.bodySmall
            )

            statusLabel?.let {
                Text(
                    text = it,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.error,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
    Spacer(modifier = Modifier.height(8.dp))
}


@Composable
fun DeviationAwareText(
    plannedValue: String,
    changedValue: String?,
    style: TextStyle,
    modifier: Modifier = Modifier,
    unchangedColor: Color = Color.Unspecified,
    unchangedFontWeight: FontWeight? = null,
    changedFontWeight: FontWeight? = null,
    plannedChangedColor: Color = MaterialTheme.colorScheme.onSurfaceVariant,
    isTrainPath: Boolean = false
) {
    if (changedValue == null) {
        Text(
            text = plannedValue,
            modifier = modifier,
            style = style,
            color = unchangedColor,
            fontWeight = unchangedFontWeight
        )
        return
    }
    if (isTrainPath) {
        Column(modifier = modifier) {
            Text(
            text = plannedValue,
            style = style,
            color = plannedChangedColor,
            textDecoration = TextDecoration.LineThrough,
            fontWeight = unchangedFontWeight
        )
        Text(
            text = changedValue,
            style = style,
            color = MaterialTheme.colorScheme.error,
            fontWeight = changedFontWeight
        )
        }
    } else {
        Row(
            modifier = modifier,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = plannedValue,
                style = style,
                color = plannedChangedColor,
                textDecoration = TextDecoration.LineThrough,
                fontWeight = unchangedFontWeight
            )
            Text(
                text = changedValue,
                style = style,
                color = MaterialTheme.colorScheme.error,
                fontWeight = changedFontWeight
            )
        }
    }
}

private fun formatTime(dateTime: LocalDateTime): String {
    return "${dateTime.hour.toString().padStart(2, '0')}:${dateTime.minute.toString().padStart(2, '0')}"
}

private fun formatStops(stops: List<String>, maxVisibleStops: Int = 3): String {
    val shownStops = stops.take(maxVisibleStops).joinToString(", ")
    return if (stops.size > maxVisibleStops) "$shownStops ..." else shownStops
}

private fun formatTripStatusLabel(status: TripStatus?): String? {
    return when (status) {
        TripStatus.CANCELED -> "Ausfall"
        TripStatus.ADDED -> "Zusatzfahrt"
        TripStatus.PLANNED, null -> null
    }
}
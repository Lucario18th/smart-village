val unspecified_scheme = ColorFamily(
    Color.Unspecified, Color.Unspecified, Color.Unspecified, Color.Unspecified
)

@Composable
expect fun getPlatformColorScheme(darkTheme: Boolean): androidx.compose.material3.ColorScheme?

@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Dynamic color is available on Android 12+
    dynamicColor: Boolean = true,
    content: @Composable() () -> Unit
) {
    val colorScheme = when {
        dynamicColor -> {
            val platformScheme = getPlatformColorScheme(darkTheme)
            platformScheme ?: if (darkTheme) darkScheme else lightScheme
        }

        darkTheme -> darkScheme
        else -> lightScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = einkaufsliste2Typography(),
        content = content
    )
}
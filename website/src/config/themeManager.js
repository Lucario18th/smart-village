export const THEME_COMBINATIONS = {
  light_standard: 'light',
  light_medium: 'light-medium-contrast',
  light_high: 'light-high-contrast',
  dark_standard: 'dark',
  dark_medium: 'dark-medium-contrast',
  dark_high: 'dark-high-contrast',
}

export function getThemeClass(themeMode, contrast) {
  const key = `${themeMode}_${contrast}`
  return THEME_COMBINATIONS[key] ?? 'light'
}

export function applyThemeToDOM(themeClass) {
  const html = document.documentElement

  Object.values(THEME_COMBINATIONS).forEach((cls) => {
    html.classList.remove(cls)
  })

  html.classList.add(themeClass)
}

export function getCurrentThemeFromDOM() {
  const html = document.documentElement

  for (const themeClass of Object.values(THEME_COMBINATIONS)) {
    if (html.classList.contains(themeClass)) {
      return themeClass
    }
  }

  return 'light'
}

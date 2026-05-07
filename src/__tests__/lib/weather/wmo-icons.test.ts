import { describe, it, expect } from 'vitest'
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from 'lucide-react'
import { getWeatherIcon } from '@/lib/weather/wmo-icons'

describe('getWeatherIcon', () => {
  it.each([
    [0, Sun, 'Clear'],
    [1, Sun, 'Mainly clear'],
    [2, CloudSun, 'Partly cloudy'],
    [3, Cloud, 'Overcast'],
    [45, CloudFog, 'Fog'],
    [48, CloudFog, 'Fog'],
    [51, CloudDrizzle, 'Drizzle'],
    [55, CloudDrizzle, 'Drizzle'],
    [57, CloudDrizzle, 'Drizzle'],
    [61, CloudRain, 'Rain'],
    [65, CloudRain, 'Rain'],
    [71, CloudSnow, 'Snow'],
    [77, CloudSnow, 'Snow'],
    [80, CloudRain, 'Showers'],
    [82, CloudRain, 'Showers'],
    [85, CloudSnow, 'Snow showers'],
    [86, CloudSnow, 'Snow showers'],
    [95, CloudLightning, 'Thunderstorm'],
    [99, CloudLightning, 'Thunderstorm'],
  ])('maps WMO code %i to the expected icon and label', (code, expectedIcon, expectedLabel) => {
    const { Icon, label } = getWeatherIcon(code)
    expect(Icon).toBe(expectedIcon)
    expect(label).toBe(expectedLabel)
  })

  it('falls back to a generic cloudy icon for unknown codes', () => {
    const { Icon, label } = getWeatherIcon(999)
    expect(Icon).toBe(Cloud)
    expect(label).toBe('Cloudy')
  })
})

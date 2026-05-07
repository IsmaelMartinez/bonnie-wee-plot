/**
 * Maps WMO weather interpretation codes to a small set of lucide-react icons
 * and a short label. WMO codes come from the Open-Meteo `weathercode` field.
 *
 * Reference: https://open-meteo.com/en/docs (Weather variable documentation,
 * "WMO Weather interpretation codes (WW)").
 */

import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  type LucideIcon,
} from 'lucide-react'

export interface WeatherIcon {
  Icon: LucideIcon
  label: string
}

export function getWeatherIcon(code: number): WeatherIcon {
  if (code === 0) return { Icon: Sun, label: 'Clear' }
  if (code === 1) return { Icon: Sun, label: 'Mainly clear' }
  if (code === 2) return { Icon: CloudSun, label: 'Partly cloudy' }
  if (code === 3) return { Icon: Cloud, label: 'Overcast' }
  if (code === 45 || code === 48) return { Icon: CloudFog, label: 'Fog' }
  if (code >= 51 && code <= 57) return { Icon: CloudDrizzle, label: 'Drizzle' }
  if (code >= 61 && code <= 67) return { Icon: CloudRain, label: 'Rain' }
  if (code >= 71 && code <= 77) return { Icon: CloudSnow, label: 'Snow' }
  if (code >= 80 && code <= 82) return { Icon: CloudRain, label: 'Showers' }
  if (code === 85 || code === 86) return { Icon: CloudSnow, label: 'Snow showers' }
  if (code >= 95 && code <= 99) return { Icon: CloudLightning, label: 'Thunderstorm' }
  return { Icon: Cloud, label: 'Cloudy' }
}

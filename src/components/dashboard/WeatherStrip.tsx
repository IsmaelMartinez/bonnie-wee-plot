'use client'

import { ForecastDay } from '@/lib/weather/open-meteo'
import { getWeatherIcon } from '@/lib/weather/wmo-icons'

interface WeatherStripProps {
  forecast: ForecastDay[]
}

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })

function tileLabel(isoDate: string, index: number): string {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  // Parse as local date — Open-Meteo returns YYYY-MM-DD without timezone.
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return DAY_LABEL_FORMATTER.format(new Date(y, m - 1, d))
}

export default function WeatherStrip({ forecast }: WeatherStripProps) {
  if (forecast.length === 0) return null

  return (
    <div
      className="grid grid-cols-3 gap-2 -mt-4"
      role="region"
      aria-label="Three day weather forecast"
    >
      {forecast.map((day, index) => {
        const { Icon, label } = getWeatherIcon(day.weatherCode)
        return (
          <div
            key={day.date}
            className="zen-card px-3 py-3 flex flex-col items-center text-center"
          >
            <div className="text-xs font-medium text-zen-stone-500 mb-1">
              {tileLabel(day.date, index)}
            </div>
            <Icon
              className="w-7 h-7 text-zen-water-600 mb-1"
              aria-label={label}
            />
            <div className="text-sm text-zen-ink-900">
              {Math.round(day.tempMaxC)}° <span className="text-zen-stone-400">/ {Math.round(day.tempMinC)}°</span>
            </div>
            {day.precipitationMm > 0 && (
              <div className="text-xs text-zen-water-600 mt-0.5">
                {day.precipitationMm.toFixed(1)}mm
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

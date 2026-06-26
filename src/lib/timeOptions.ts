const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

function timeToMinutes(value: string) {
  const match = TIME_PATTERN.exec(value)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function minutesToTime(value: number) {
  const hours = String(Math.floor(value / 60)).padStart(2, '0')
  const minutes = String(value % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function buildTenMinuteTimeOptions(start = '07:00', end = '23:50'): string[] {
  const startMinutes = timeToMinutes(start) ?? timeToMinutes('07:00')
  const endMinutes = timeToMinutes(end) ?? timeToMinutes('23:50')
  if (startMinutes === null || endMinutes === null || startMinutes > endMinutes) return []

  const options: string[] = []
  for (let minutes = startMinutes; minutes <= endMinutes; minutes += 10) {
    options.push(minutesToTime(minutes))
  }
  return options
}

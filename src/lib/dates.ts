function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function toUtcDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = pad2(date.getUTCMonth() + 1)
  const day = pad2(date.getUTCDate())
  return `${year}-${month}-${day}`
}

export function toLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  return `${year}-${month}-${day}`
}

export function toUtcRange(dateFrom: Date, dateTo: Date): { date_from: string; date_to: string } {
  return {
    date_from: toUtcDate(dateFrom),
    date_to: toUtcDate(dateTo),
  }
}

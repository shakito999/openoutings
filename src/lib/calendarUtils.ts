// Generate ICS (iCalendar) file content for adding events to calendar
export function generateICS(event: {
  title: string
  description: string
  startDate: Date
  address?: string
  url?: string
}) {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  // End time is 2 hours after start by default
  const endDate = new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000)

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OpenOutings//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(event.startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}${event.url ? `\\n\\nEvent Link: ${event.url}` : ''}`,
    event.address ? `LOCATION:${event.address}` : '',
    `UID:${Date.now()}@openoutings.com`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')

  return icsContent
}

// Download ICS file
export function downloadICS(event: {
  title: string
  description: string
  startDate: Date
  address?: string
  url?: string
}) {
  const icsContent = generateICS(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

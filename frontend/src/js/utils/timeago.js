import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

TimeAgo.addDefaultLocale(en)
export const timeAgo = new TimeAgo('en-US')

export function timeAgoLarge(date) {
    const target = date instanceof Date ? date : new Date(date)
    const now = new Date()

    const future = target.getTime() > now.getTime()
    const start = future ? now : target
    const end = future ? target : now

    // calendar-accurate diff by walking year/month/day components
    let years = end.getFullYear() - start.getFullYear()
    let months = end.getMonth() - start.getMonth()
    let days = end.getDate() - start.getDate()

    if (days < 0) {
        months -= 1
        // days in the month before `end`'s month
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0)
        days += prevMonth.getDate()
    }

    if (months < 0) {
        years -= 1
        months += 12
    }

    const parts = []
    if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`)
    if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`)
    // only show days if under a year, otherwise it gets noisy
    if (years === 0 && days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`)

    if (parts.length === 0) {
        return 'just now'
    }

    const joined = parts.join(' ')
    return future ? `in ${joined}` : `${joined} ago`
}
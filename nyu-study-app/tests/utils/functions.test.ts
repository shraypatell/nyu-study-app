import { describe, it, expect } from 'vitest'

describe('Utility Functions', () => {
  describe('Time Formatting', () => {
    it('formats seconds to HH:MM:SS', () => {
      const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }

      expect(formatTime(0)).toBe('00:00:00')
      expect(formatTime(3661)).toBe('01:01:01')
      expect(formatTime(7200)).toBe('02:00:00')
    })

    it('formats seconds to hours and minutes', () => {
      const formatTimeShort = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${hours}h ${minutes}m`
      }

      expect(formatTimeShort(0)).toBe('0h 0m')
      expect(formatTimeShort(3660)).toBe('1h 1m')
      expect(formatTimeShort(7200)).toBe('2h 0m')
    })
  })

  describe('Email Validation', () => {
    it('validates NYU email format', () => {
      const isNYUEmail = (email: string) => {
        return email.endsWith('@nyu.edu')
      }

      expect(isNYUEmail('student@nyu.edu')).toBe(true)
      expect(isNYUEmail('professor@nyu.edu')).toBe(true)
      expect(isNYUEmail('student@gmail.com')).toBe(false)
      expect(isNYUEmail('student@nyu.com')).toBe(false)
      expect(isNYUEmail('student@')).toBe(false)
    })
  })

  describe('Text Truncation', () => {
    it('truncates text to specified length', () => {
      const truncate = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text
        return text.slice(0, maxLength) + '...'
      }

      expect(truncate('Hello World', 5)).toBe('Hello...')
      expect(truncate('Hi', 10)).toBe('Hi')
      expect(truncate('', 5)).toBe('')
    })
  })

  describe('Rank Styling', () => {
    it('returns correct rank styles', () => {
      const getRankStyle = (rank: number) => {
        if (rank === 1) return 'bg-yellow-100 text-yellow-800'
        if (rank === 2) return 'bg-gray-100 text-gray-800'
        if (rank === 3) return 'bg-orange-100 text-orange-800'
        return 'bg-gray-50 text-gray-600'
      }

      expect(getRankStyle(1)).toBe('bg-yellow-100 text-yellow-800')
      expect(getRankStyle(2)).toBe('bg-gray-100 text-gray-800')
      expect(getRankStyle(3)).toBe('bg-orange-100 text-orange-800')
      expect(getRankStyle(4)).toBe('bg-gray-50 text-gray-600')
      expect(getRankStyle(10)).toBe('bg-gray-50 text-gray-600')
    })
  })
})

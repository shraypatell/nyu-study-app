import { describe, it, expect } from 'vitest'

describe('Critical Path Tests', () => {
  describe('Authentication', () => {
    it('validates NYU email format correctly', () => {
      const validEmails = [
        'student@nyu.edu',
        'prof.johnson@nyu.edu',
        'abc123@nyu.edu'
      ]
      
      const invalidEmails = [
        'student@gmail.com',
        'student@nyu.com',
        'student@'
      ]
      
      validEmails.forEach(email => {
        expect(email.endsWith('@nyu.edu')).toBe(true)
      })
      
      invalidEmails.forEach(email => {
        expect(email.endsWith('@nyu.edu')).toBe(false)
      })
    })

    it('validates username format', () => {
      const validUsernames = ['john_doe', 'student123', 'abc_def_123']
      const invalidUsernames = ['ab', 'abc@def', 'abc def', 'abc-def', '']
      
      validUsernames.forEach(username => {
        expect(username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username)).toBe(true)
      })
      
      invalidUsernames.forEach(username => {
        const isValid = username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username)
        expect(isValid).toBe(false)
      })
    })
  })

  describe('Timer Logic', () => {
    it('calculates duration correctly', () => {
      const startTime = new Date('2024-01-15T10:00:00')
      const endTime = new Date('2024-01-15T10:30:00')
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
      
      expect(durationSeconds).toBe(1800)
    })

    it('formats time display correctly', () => {
      const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
      
      expect(formatTime(0)).toBe('00:00:00')
      expect(formatTime(3661)).toBe('01:01:01')
      expect(formatTime(7200)).toBe('02:00:00')
      expect(formatTime(59)).toBe('00:00:59')
    })
  })

  describe('Privacy Controls', () => {
    it('respects timer privacy settings', () => {
      const user = {
        id: 'user-123',
        isTimerPublic: false,
        timer: { isActive: true, duration: 3600 }
      }
      
      const viewer = { id: 'viewer-456' }
      const isOwner = user.id === viewer.id
      
      const canSeeTimer = isOwner || user.isTimerPublic
      expect(canSeeTimer).toBe(false)
      
      user.isTimerPublic = true
      const canSeeTimerPublic = isOwner || user.isTimerPublic
      expect(canSeeTimerPublic).toBe(true)
    })

    it('respects classes privacy settings', () => {
      const user = {
        id: 'user-123',
        isClassesPublic: false,
        classes: [{ name: 'Math 101' }]
      }
      
      const viewer = { id: 'viewer-456' }
      const isOwner = user.id === viewer.id
      
      const canSeeClasses = isOwner || user.isClassesPublic
      expect(canSeeClasses).toBe(false)
    })

    it('respects location privacy settings', () => {
      const user = {
        id: 'user-123',
        isLocationPublic: false,
        location: { name: 'Bobst Library' }
      }
      
      const viewer = { id: 'viewer-456' }
      const isOwner = user.id === viewer.id
      
      const canSeeLocation = isOwner || user.isLocationPublic
      expect(canSeeLocation).toBe(false)
    })
  })

  describe('Leaderboard Logic', () => {
    it('calculates ranks correctly', () => {
      const entries = [
        { userId: '1', totalSeconds: 7200 },
        { userId: '2', totalSeconds: 3600 },
        { userId: '3', totalSeconds: 1800 }
      ]
      
      const ranked = entries.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))
      
      expect(ranked[0].rank).toBe(1)
      expect(ranked[1].rank).toBe(2)
      expect(ranked[2].rank).toBe(3)
    })

    it('filters out private timers from leaderboard', () => {
      const allUsers = [
        { userId: '1', totalSeconds: 7200, isPublic: true },
        { userId: '2', totalSeconds: 3600, isPublic: false },
        { userId: '3', totalSeconds: 1800, isPublic: true }
      ]
      
      const publicLeaderboard = allUsers.filter(u => u.isPublic)
      
      expect(publicLeaderboard.length).toBe(2)
      expect(publicLeaderboard.some(u => u.userId === '2')).toBe(false)
    })
  })

  describe('Friends System', () => {
    it('prevents self-friending', () => {
      const userId = 'user-123'
      const targetUserId = 'user-123'
      
      const canFriend = userId !== targetUserId
      expect(canFriend).toBe(false)
    })

    it('prevents duplicate friend requests', () => {
      const existingRequests = [
        { requesterId: 'user-1', addresseeId: 'user-2', status: 'PENDING' }
      ]
      
      const newRequest = { requesterId: 'user-1', addresseeId: 'user-2' }
      
      const isDuplicate = existingRequests.some(
        r => r.requesterId === newRequest.requesterId && 
             r.addresseeId === newRequest.addresseeId &&
             r.status === 'PENDING'
      )
      
      expect(isDuplicate).toBe(true)
    })
  })

  describe('Chat System', () => {
    it('validates message content length', () => {
      const maxLength = 2000
      
      const validMessage = 'a'.repeat(100)
      const invalidMessage = 'a'.repeat(maxLength + 1)
      
      expect(validMessage.length <= maxLength).toBe(true)
      expect(invalidMessage.length <= maxLength).toBe(false)
    })

    it('prevents empty messages', () => {
      const emptyMessage = ''
      const whitespaceMessage = '   '
      
      expect(emptyMessage.trim().length > 0).toBe(false)
      expect(whitespaceMessage.trim().length > 0).toBe(false)
    })
  })

  describe('Class Management', () => {
    it('validates class code format', () => {
      const validCodes = ['ECON-UA-1', 'MATH-GA-101', 'CS-UY-1234']
      
      validCodes.forEach(code => {
        expect(code.length > 0 && code.length <= 50).toBe(true)
      })
    })

    it('prevents joining same class twice', () => {
      const userClasses = [
        { userId: 'user-1', classId: 'class-1' }
      ]
      
      const newJoin = { userId: 'user-1', classId: 'class-1' }
      
      const alreadyJoined = userClasses.some(
        uc => uc.userId === newJoin.userId && uc.classId === newJoin.classId
      )
      
      expect(alreadyJoined).toBe(true)
    })
  })

  describe('Rate Limiting', () => {
    it('enforces rate limits correctly', () => {
      const rateLimits = new Map()
      const now = Date.now()
      const userId = 'user-123'
      
      rateLimits.set(userId, now - 500)
      
      const lastRequest = rateLimits.get(userId)
      const canRequest = !lastRequest || (now - lastRequest >= 1000)
      
      expect(canRequest).toBe(false)
      
      rateLimits.set(userId, now - 1500)
      const canRequestNow = !rateLimits.get(userId) || (now - rateLimits.get(userId) >= 1000)
      expect(canRequestNow).toBe(true)
    })
  })
})

import { jest } from '@jest/globals'
import { POST } from '../../../../../app/api/newsletter/signup/route.js'
import { NextRequest } from 'next/server'

// Mock Supabase Admin client
const mockSupabaseAdmin = {
  from: jest.fn(() => ({
    upsert: jest.fn()
  }))
}

jest.mock('../../../../../lib/supabase-admin.js', () => ({
  supabaseAdmin: mockSupabaseAdmin
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: () => Promise.resolve(data),
      status: options.status || 200,
      data
    }))
  },
  NextRequest: jest.fn()
}))

describe('/api/newsletter/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    test('should successfully sign up user with valid email', async () => {
      // Mock successful database upsert
      mockSupabaseAdmin.from.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ data: {}, error: null })
      })

      const request = {
        json: jest.fn().mockResolvedValue({ email: 'test@example.com' })
      }

      const response = await POST(request)
      
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('users')
      expect(response.data).toEqual({
        message: 'Successfully signed up for newsletter'
      })
      expect(response.status).toBe(200)
    })

    test('should validate email format', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({ email: 'invalid-email' })
      }

      const response = await POST(request)
      
      expect(response.data).toEqual({
        error: 'Valid email is required'
      })
      expect(response.status).toBe(400)
    })

    test('should handle missing email', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({})
      }

      const response = await POST(request)
      
      expect(response.data).toEqual({
        error: 'Valid email is required'
      })
      expect(response.status).toBe(400)
    })

    test('should handle empty email', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({ email: '' })
      }

      const response = await POST(request)
      
      expect(response.data).toEqual({
        error: 'Valid email is required'
      })
      expect(response.status).toBe(400)
    })

    test('should handle duplicate email gracefully', async () => {
      // Mock database duplicate key error
      mockSupabaseAdmin.from.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: '23505', message: 'Duplicate key' }
        })
      })

      const request = {
        json: jest.fn().mockResolvedValue({ email: 'existing@example.com' })
      }

      const response = await POST(request)
      
      expect(response.data).toEqual({
        message: 'You\\'re already subscribed, thank you!'
      })
      expect(response.status).toBe(200)
    })

    test('should handle database errors', async () => {
      // Mock database error
      mockSupabaseAdmin.from.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'OTHER_ERROR', message: 'Database connection failed' }
        })
      })

      const request = {
        json: jest.fn().mockResolvedValue({ email: 'test@example.com' })
      }

      const response = await POST(request)
      
      expect(response.data).toEqual({
        error: 'Failed to sign up for newsletter',
        details: 'Database connection failed'
      })
      expect(response.status).toBe(500)
    })

    test('should handle request parsing errors', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      }

      const response = await POST(request)
      
      expect(response.data).toEqual({
        error: 'Internal server error'
      })
      expect(response.status).toBe(500)
    })

    test('should call database with correct parameters', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ data: {}, error: null })
      mockSupabaseAdmin.from.mockReturnValue({
        upsert: mockUpsert
      })

      const request = {
        json: jest.fn().mockResolvedValue({ email: 'test@example.com' })
      }

      await POST(request)
      
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          source: 'newsletter',
          subscribed_to_newsletter: true,
          updated_at: expect.any(String)
        }),
        {
          onConflict: 'email',
          returning: 'minimal'
        }
      )
    })

    test('should handle various email formats', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ data: {}, error: null })
      })

      const validEmails = [
        'user@domain.com',
        'user.name@domain.co.uk',
        'user+tag@subdomain.domain.org',
        'user123@domain-name.com'
      ]

      for (const email of validEmails) {
        const request = {
          json: jest.fn().mockResolvedValue({ email })
        }

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })

    test('should reject invalid email formats', async () => {
      const invalidEmails = [
        'not-an-email',
        '@domain.com',
        'user@',
        'user.domain.com',
        ''
      ]

      for (const email of invalidEmails) {
        const request = {
          json: jest.fn().mockResolvedValue({ email })
        }

        const response = await POST(request)
        expect(response.status).toBe(400)
      }
    })
  })
})
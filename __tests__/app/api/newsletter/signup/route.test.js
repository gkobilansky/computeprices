import { jest } from '@jest/globals'
import { POST } from '../../../../../app/api/newsletter/signup/route.js'
import { supabaseAdmin } from '../../../../../lib/supabase-admin.js'

describe('/api/newsletter/signup', () => {
  // Clean up test data after each test
  afterEach(async () => {
    // Clean up any test emails
    await supabaseAdmin
      .from('users')
      .delete()
      .like('email', 'test-%@example.com')
  })

  describe('POST', () => {
    test('should successfully sign up user with valid email', async () => {
      const testEmail = `test-${Date.now()}@example.com`
      const request = {
        json: jest.fn().mockResolvedValue({ email: testEmail })
      }

      const response = await POST(request)
      const data = await response.json()

      expect(data).toEqual({
        message: 'Successfully signed up for newsletter'
      })
      expect(response.status).toBe(200)

      // Verify the user was created in the database
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', testEmail)
        .single()

      expect(user).toBeTruthy()
      expect(user.email).toBe(testEmail)
      expect(user.subscribed_to_newsletter).toBe(true)
    })

    test('should validate email format - no @', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({ email: 'invalid-email' })
      }

      const response = await POST(request)
      const data = await response.json()

      expect(data).toEqual({
        error: 'Valid email is required'
      })
      expect(response.status).toBe(400)
    })

    test('should handle missing email', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({})
      }

      const response = await POST(request)
      const data = await response.json()

      expect(data).toEqual({
        error: 'Valid email is required'
      })
      expect(response.status).toBe(400)
    })

    test('should handle empty email', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({ email: '' })
      }

      const response = await POST(request)
      const data = await response.json()

      expect(data).toEqual({
        error: 'Valid email is required'
      })
      expect(response.status).toBe(400)
    })

    test('should handle duplicate email gracefully with upsert', async () => {
      const testEmail = `test-${Date.now()}@example.com`

      // First signup
      const request1 = {
        json: jest.fn().mockResolvedValue({ email: testEmail })
      }
      const response1 = await POST(request1)
      expect(response1.status).toBe(200)

      // Second signup with same email - should succeed with upsert
      const request2 = {
        json: jest.fn().mockResolvedValue({ email: testEmail })
      }
      const response2 = await POST(request2)
      const data2 = await response2.json()

      // Upsert allows duplicates, so this should succeed
      expect(response2.status).toBe(200)
      expect(data2.message).toBeTruthy()
    })

    test('should handle request parsing errors', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      }

      const response = await POST(request)
      const data = await response.json()

      expect(data).toEqual({
        error: 'Internal server error'
      })
      expect(response.status).toBe(500)
    })

    test('should call database with correct email', async () => {
      const testEmail = `test-${Date.now()}@example.com`
      const request = {
        json: jest.fn().mockResolvedValue({ email: testEmail })
      }

      await POST(request)

      // Verify the data was inserted correctly
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', testEmail)
        .single()

      expect(user.email).toBe(testEmail)
      expect(user.source).toBe('newsletter')
      expect(user.subscribed_to_newsletter).toBe(true)
      expect(user.updated_at).toBeTruthy()
    })

    test('should handle various valid email formats', async () => {
      const validEmails = [
        `user-${Date.now()}@domain.com`,
        `user.name-${Date.now()}@domain.co.uk`,
        `user+tag-${Date.now()}@subdomain.domain.org`,
        `user123-${Date.now()}@domain-name.com`
      ]

      for (const email of validEmails) {
        const request = {
          json: jest.fn().mockResolvedValue({ email })
        }

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })

    test('should reject email without @ symbol', async () => {
      const invalidEmails = [
        'not-an-email',
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

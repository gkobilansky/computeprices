import { jest } from '@jest/globals'
import { POST } from '../../../../../app/api/newsletter/signup/route.js'
import { supabaseAdmin } from '../../../../../lib/supabase-admin.js'

// Helper to create mock request with JSON body
function createRequest(body) {
  return { json: jest.fn().mockResolvedValue(body) }
}

// Helper to generate unique test email
function generateTestEmail() {
  return `test-${Date.now()}@example.com`
}

describe('/api/newsletter/signup', () => {
  afterEach(async () => {
    await supabaseAdmin
      .from('users')
      .delete()
      .like('email', 'test-%@example.com')
  })

  describe('POST', () => {
    test('should successfully sign up user with valid email', async () => {
      const testEmail = generateTestEmail()
      const response = await POST(createRequest({ email: testEmail }))
      const data = await response.json()

      expect(data).toEqual({ message: 'Successfully signed up for newsletter' })
      expect(response.status).toBe(200)

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
      const response = await POST(createRequest({ email: 'invalid-email' }))
      const data = await response.json()

      expect(data).toEqual({ error: 'Valid email is required' })
      expect(response.status).toBe(400)
    })

    test('should handle missing email', async () => {
      const response = await POST(createRequest({}))
      const data = await response.json()

      expect(data).toEqual({ error: 'Valid email is required' })
      expect(response.status).toBe(400)
    })

    test('should handle empty email', async () => {
      const response = await POST(createRequest({ email: '' }))
      const data = await response.json()

      expect(data).toEqual({ error: 'Valid email is required' })
      expect(response.status).toBe(400)
    })

    test('should handle duplicate email gracefully with upsert', async () => {
      const testEmail = generateTestEmail()

      const response1 = await POST(createRequest({ email: testEmail }))
      expect(response1.status).toBe(200)

      const response2 = await POST(createRequest({ email: testEmail }))
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2.message).toBeTruthy()
    })

    test('should handle request parsing errors', async () => {
      const request = { json: jest.fn().mockRejectedValue(new Error('Invalid JSON')) }
      const response = await POST(request)
      const data = await response.json()

      expect(data).toEqual({ error: 'Internal server error' })
      expect(response.status).toBe(500)
    })

    test('should call database with correct email and default source', async () => {
      const testEmail = generateTestEmail()
      await POST(createRequest({ email: testEmail }))

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

    test('should use custom source when provided', async () => {
      const testEmail = generateTestEmail()
      await POST(createRequest({ email: testEmail, source: 'price-alert' }))

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', testEmail)
        .single()

      expect(user.email).toBe(testEmail)
      expect(user.source).toBe('price-alert')
      expect(user.subscribed_to_newsletter).toBe(true)
    })

    test('should handle various valid email formats', async () => {
      const timestamp = Date.now()
      const validEmails = [
        `user-${timestamp}@domain.com`,
        `user.name-${timestamp}@domain.co.uk`,
        `user+tag-${timestamp}@subdomain.domain.org`,
        `user123-${timestamp}@domain-name.com`
      ]

      for (const email of validEmails) {
        const response = await POST(createRequest({ email }))
        expect(response.status).toBe(200)
      }
    })

    test('should reject email without @ symbol', async () => {
      const invalidEmails = ['not-an-email', 'user.domain.com', '']

      for (const email of invalidEmails) {
        const response = await POST(createRequest({ email }))
        expect(response.status).toBe(400)
      }
    })
  })
})

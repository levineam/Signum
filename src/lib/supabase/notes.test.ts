import { describe, it, expect, vi, afterEach } from 'vitest'

const resetEnv = () => {
  delete process.env.NEXT_PUBLIC_ENABLE_ENCRYPTION
}

const loadModule = async (
  {
    schemaError = null,
    hasKey = true,
    flag = 'true'
  }: { schemaError?: { message: string; code?: string } | null; hasKey?: boolean; flag?: string }
) => {
  process.env.NEXT_PUBLIC_ENABLE_ENCRYPTION = flag

  const selectMock = vi.fn(() => ({
    limit: async () => ({ data: [], error: schemaError })
  }))

  const fromMock = vi.fn(() => ({ select: selectMock }))

  vi.doMock('@/lib/supabase', () => ({
    supabase: { from: fromMock }
  }))

  const hasEncryptionKey = vi.fn().mockResolvedValue(hasKey)
  const getUserEncryptionKey = vi.fn().mockResolvedValue('mock-key')

  vi.doMock('@/lib/crypto/keyManagement', () => ({
    hasEncryptionKey,
    getUserEncryptionKey
  }))

  const notes = await import('@/lib/supabase/notes')
  return { notes, selectMock, hasEncryptionKey }
}

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  resetEnv()
})

describe('resolveEncryptionMode', () => {
  it('falls back to plaintext when encryption columns are missing', async () => {
    const schemaError = { message: 'column "encrypted_title" does not exist', code: 'PGRST204' }
    const { notes } = await loadModule({ schemaError })
    const result = await notes.resolveEncryptionMode('user-1')
    expect(result.canEncrypt).toBe(false)
    expect(result.reason).toBe('schema-missing')
  })

  it('enables encryption when flag, key, and schema are present', async () => {
    const { notes, hasEncryptionKey } = await loadModule({ schemaError: null })
    const result = await notes.resolveEncryptionMode('user-1')
    expect(hasEncryptionKey).toHaveBeenCalled()
    expect(result.canEncrypt).toBe(true)
    expect(result.reason).toBe('ok')
  })

  it('disables encryption when feature flag is off', async () => {
    const { notes } = await loadModule({ schemaError: null, flag: 'false' })
    const result = await notes.resolveEncryptionMode('user-1')
    expect(result.canEncrypt).toBe(false)
    expect(result.reason).toBe('flag-disabled')
  })
})

export const FORCE_TEST_USER_KEY = '__signum_force_test_user__'

export function isForcedTestUserEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.sessionStorage?.getItem(FORCE_TEST_USER_KEY) === '1'
  } catch (error) {
    console.warn('[e2eTestUtils] Unable to read force-test-user flag:', error)
    return false
  }
}

export function setForcedTestUserFlag(enabled: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (enabled) {
      window.sessionStorage?.setItem(FORCE_TEST_USER_KEY, '1')
    } else {
      window.sessionStorage?.removeItem(FORCE_TEST_USER_KEY)
    }
  } catch (error) {
    console.warn('[e2eTestUtils] Unable to set force-test-user flag:', error)
  }
}

export function clearForcedTestUserFlag() {
  setForcedTestUserFlag(false)
}


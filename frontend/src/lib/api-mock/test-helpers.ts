/**
 * 测试环境辅助函数
 */

// 测试环境专用的 mock token（与 auth.ts 中的 MOCK_ACCESS_TOKEN 保持一致）
export const TEST_AUTH_TOKEN = 'test-auth-token-12345'

// 测试环境中用于验证的简化函数
export function isTestEnvironment(): boolean {
  return typeof process !== 'undefined' && process.env.VITEST === 'true'
}

// 验证测试 token - 只接受固定的测试 token
export function isValidTestToken(token: string | null): boolean {
  if (!isTestEnvironment()) return false
  return token === TEST_AUTH_TOKEN
}

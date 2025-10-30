const MOCK_ENV_VALUES = new Set(['true', '1', 'yes'])

export function shouldEnableMocking(): boolean {
  const flag = import.meta.env.VITE_ENABLE_MOCK
  return typeof flag === 'string'
    ? MOCK_ENV_VALUES.has(flag.toLowerCase())
    : true
}

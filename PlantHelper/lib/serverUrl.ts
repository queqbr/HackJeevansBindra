// Determine the backend server URL at runtime for Expo devices.
// Priority:
// 1. EXPO_PUBLIC_SERVER_URL env (set during `expo start` or in app config)
// 2. If running in Expo client, try to derive host from debuggerHost
// 3. Fallbacks: common emulator hostnames

export function getServerUrl(): string {
  // 1) explicit env
  const env = (process.env.EXPO_PUBLIC_SERVER_URL as string) || '';
  if (env && env.trim().length > 0) return env;

  // 2) Try to use Expo Constants to detect the dev server host (works in Expo Go and dev client)
  try {
    // require at runtime so this module also works in plain Node contexts
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    const manifest = Constants?.manifest || Constants?.expoConfig || {};
    const debuggerHost = (manifest && (manifest.debuggerHost || manifest.hostUri || manifest.packagerOpts?.host)) || null;
    if (debuggerHost && typeof debuggerHost === 'string') {
      const ip = debuggerHost.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') return `http://${ip}:8000`;
    }
  } catch (e) {
    // ignore — not running in Expo environment
  }

  // 3) Platform-specific default: iOS simulator can use localhost; Android emulator needs 10.0.2.2
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Platform } = require('react-native');
    if (Platform && Platform.OS === 'ios') return 'http://localhost:8000';
    if (Platform && Platform.OS === 'android') return 'http://10.0.2.2:8000';
  } catch (e) {
    // not running in React Native runtime
  }

  // 4) final fallback
  return 'http://10.0.2.2:8000';
}

export default getServerUrl;

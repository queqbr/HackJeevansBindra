import { Stack } from 'expo-router';
import 'react-native-reanimated';

// import { useColorScheme } from '@/hooks/use-color-scheme';
import { Alert, BackHandler, Linking, Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

export const unstable_settings = {
  anchor: '(tabs)',
};

function HeaderExitButton() {
  async function exitApp() {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
      return;
    }

    const schemes = ['expo-go://', 'exp://', 'expo://'];
    let opened = false;
    for (const scheme of schemes) {
      try {
        const supported = await Linking.canOpenURL(scheme);
        if (supported) {
          await Linking.openURL(scheme);
          opened = true;
          break;
        }
      } catch {
        // ignore
      }
    }

    if (!opened) {
      Alert.alert(
        'Exit app',
        'On this platform you cannot programmatically exit. Return to the Expo Go app or close this app to reset.'
      );
    }
  }

  return (
    <Pressable onPress={exitApp} style={styles.headerButton} accessibilityRole="button">
      <Text style={styles.headerButtonText}>Exit</Text>
    </Pressable>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <Stack 
        screenOptions={{
          // Hide the default top header (big bar with the page title)
          headerShown: false,
          headerStyle: { backgroundColor: '#111827' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
  <Stack.Screen name="index" options={{ title: 'Home' }} />
      </Stack>

      {/* Floating exit button so the user can still exit while headerShown is false */}
      <View style={[styles.exitButtonContainer, Platform.OS === 'ios' ? { top: 44 } : {}]} pointerEvents="box-none">
        <HeaderExitButton />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  exitButtonContainer: {
    position: 'absolute',
    left: 8,
    top: 12,
    zIndex: 1000,
  },
});

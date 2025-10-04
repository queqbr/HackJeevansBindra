import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Alert, BackHandler, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export default function Landing() {
  const [imageUri, setImageUri] = useState<string | null>(null);

  async function requestPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access media library is required.');
      return false;
    }
    return true;
  }

  async function pickImage() {
    const ok = await requestPermissions();
    if (!ok) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access camera is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  }

  function exitApp() {
    if (Platform.OS === 'android') {
      // Gracefully exit the app on Android
      BackHandler.exitApp();
      return;
    }

    // On iOS and web we can't programmatically exit the app.
    // Try to open the Expo Go app using common schemes; fall back to an alert
    const schemes = ['expo-go://', 'exp://', 'expo://'];
    let opened = false;

    (async () => {
      for (const scheme of schemes) {
        try {
          const supported = await Linking.canOpenURL(scheme);
          if (supported) {
            await Linking.openURL(scheme);
            opened = true;
            break;
          }
        } catch {
          // ignore and try next
        }
      }

      if (!opened) {
        Alert.alert(
          'Exit app',
          'On this platform you cannot programmatically exit. To reset, return to the Expo Go app or close this app.'
        );
      }
    })();
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Get a Photo' }} />
      <Text style={styles.title}>Choose or take a photo</Text>

      <View style={styles.buttonsRow}>
        <Pressable style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Upload Photo</Text>
        </Pressable>
      </View>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No photo selected</Text>
        </View>
      )}

      {imageUri ? (
        <Pressable
          style={[styles.button, { marginTop: 12, backgroundColor: '#2a9d8f' }]}
          onPress={() => Alert.alert('Photo selected', 'You can now process or upload this photo.')}
        >
          <Text style={styles.buttonText}>Confirm</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#444',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
  },
  preview: {
    width: '100%',
    height: 300,
    marginTop: 16,
    borderRadius: 8,
  },
  placeholder: {
    width: '100%',
    height: 300,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
  },
});

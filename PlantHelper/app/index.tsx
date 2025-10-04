import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();
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
      const uri = result.assets[0].uri;
      setImageUri(uri);
      // Immediately navigate to the preview page with the selected image
      router.push({ pathname: '/preview', params: { uri } } as any);
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
      const uri = result.assets[0].uri;
      setImageUri(uri);
      // Immediately navigate to the preview page with the captured photo
      router.push({ pathname: '/preview', params: { uri } } as any);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>A Helping Hand</Text>
      <Text style={styles.title}>Identify your plant</Text>
      <Text style={styles.subtitle}>Take or upload a photo of a plant to get started</Text>

      <View style={styles.buttonsRow}>
        <Pressable style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Upload Photo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#111',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 0,
  },
  appName: {
    color: '#0f766e',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'none',
    marginBottom: 8,
    fontStyle: 'italic',
    // Try to give a flowy look using available fonts; for a true custom font,
    // add a font file and load it with expo-font.
    fontFamily: 'serif',
  },
  subtitle: {
    color: '#444',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f766e',
    borderRadius: 8,
    marginHorizontal: 6,
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
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
  },
});

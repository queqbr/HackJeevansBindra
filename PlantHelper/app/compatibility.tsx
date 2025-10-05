import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function Compatibility() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        // First prompt for soil photo
        const soilChoice = await new Promise<string | null>((resolve) =>
          Alert.alert('Upload soil photo', 'Choose how to provide a soil photo', [
            { text: 'Take Photo', onPress: () => resolve('camera') },
            { text: 'Choose from Library', onPress: () => resolve('library') },
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          ])
        );

        if (!mounted) return;
        if (!soilChoice) {
          router.back();
          return;
        }

        let soilUri: string | null = null;
        if (soilChoice === 'camera') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission required', 'Camera permission is required');
            router.back();
            return;
          }
          const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
          if (!mounted) return;
          if (res.canceled || !res.assets || res.assets.length === 0) {
            router.back();
            return;
          }
          soilUri = res.assets[0].uri;
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission required', 'Media library permission is required');
            router.back();
            return;
          }
          const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
          if (!mounted) return;
          if (res.canceled || !res.assets || res.assets.length === 0) {
            router.back();
            return;
          }
          soilUri = res.assets[0].uri;
        }

        // Then prompt for plant photo
        const plantChoice = await new Promise<string | null>((resolve) =>
          Alert.alert('Upload plant photo', 'Choose how to provide a plant photo', [
            { text: 'Take Photo', onPress: () => resolve('camera') },
            { text: 'Choose from Library', onPress: () => resolve('library') },
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          ])
        );

        if (!mounted) return;
        if (!plantChoice) {
          router.back();
          return;
        }

        let plantUri: string | null = null;
        if (plantChoice === 'camera') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission required', 'Camera permission is required');
            router.back();
            return;
          }
          const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
          if (!mounted) return;
          if (res.canceled || !res.assets || res.assets.length === 0) {
            router.back();
            return;
          }
          plantUri = res.assets[0].uri;
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission required', 'Media library permission is required');
            router.back();
            return;
          }
          const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
          if (!mounted) return;
          if (res.canceled || !res.assets || res.assets.length === 0) {
            router.back();
            return;
          }
          plantUri = res.assets[0].uri;
        }

        // Navigate to preview with both URIs
        if (!mounted) return;
        router.push({ pathname: '/preview', params: { uri: soilUri, uri2: plantUri } } as any);
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compatibility check (placeholder)</Text>
      <Text style={styles.text}>This screen will let users upload soil and plant photos for compatibility checks.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f766e', marginBottom: 8 },
  text: { color: '#444' },
});

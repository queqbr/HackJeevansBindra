import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function SoilQuestionnaire() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        // ask user whether to take photo or choose from library
        const choice = await new Promise<string | null>((resolve) =>
          Alert.alert('Upload soil photo', 'Choose how to provide a soil photo', [
            { text: 'Take Photo', onPress: () => resolve('camera') },
            { text: 'Choose from Library', onPress: () => resolve('library') },
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          ])
        );

        if (!mounted) return;
        if (!choice) {
          router.back();
          return;
        }

        if (choice === 'camera') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission required', 'Camera permission is required');
            router.back();
            return;
          }

          const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
          if (!mounted) return;
          if (result.canceled || !result.assets || result.assets.length === 0) {
            router.back();
            return;
          }

          const uri = result.assets[0].uri;
          router.push({ pathname: '/preview', params: { uri } } as any);
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission required', 'Media library permission is required');
            router.back();
            return;
          }

          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
          if (!mounted) return;
          if (result.canceled || !result.assets || result.assets.length === 0) {
            router.back();
            return;
          }

          const uri = result.assets[0].uri;
          router.push({ pathname: '/preview', params: { uri } } as any);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Soil questionnaire (placeholder)</Text>
      <Text style={styles.text}>This screen will let users upload a soil photo and answer lifestyle questions.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f766e', marginBottom: 8 },
  text: { color: '#444' },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function Preview() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const router = useRouter();

  function identify() {
    // Placeholder identify action — replace with real model/API call later
    Alert.alert('Identifying...', 'This would send the photo to the identification model.');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Preview</Text>

      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No image to preview</Text>
        </View>
      )}

      <View style={styles.row}>
        <Pressable style={[styles.button, { backgroundColor: '#2a9d8f' }]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
        <Pressable style={[styles.button, { backgroundColor: '#2a9d8f' }]} onPress={identify}>
          <Text style={styles.buttonText}>Identify</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    marginBottom: 12,
  },
  placeholder: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    color: '#999',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  buttonText: {
    color: '#fff',
  },
});

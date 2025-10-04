import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home screen</Text>
      <Pressable
        onPress={() => router.push('/about')}
        style={styles.button}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Go to About screen</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push(('/landing' as any))}
        style={[styles.button, { marginTop: 8 }]}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Open Landing (Take / Upload Photo)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
  button: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#444',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

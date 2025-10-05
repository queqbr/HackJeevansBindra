import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

type RecItem = { name?: string; reason?: string } | string;

export default function Recommendations() {
  const params = useLocalSearchParams<{ result?: string }>();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!params?.result) return;
    try {
      const parsed = JSON.parse(params.result as string);
      setResult(parsed);
    } catch (e) {
      // fallback: set raw text
      setResult({ ok: false, raw: params.result });
    }
  }, [params?.result]);

  const recs: RecItem[] = result?.recommendations || [];

  return (
    <View style={styles.container}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Recommendations</Text>

      {result?.explanation ? <Text style={styles.explanation}>{result.explanation}</Text> : null}

      <FlatList
        data={recs}
        keyExtractor={(item, idx) => `${typeof item}-${idx}`}
        style={styles.list}
        renderItem={({ item }) => {
          const name = typeof item === 'string' ? item : item.name || 'Unknown';
          const reason = typeof item === 'string' ? undefined : item.reason;
          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{name}</Text>
              {reason ? <Text style={styles.cardReason}>{reason}</Text> : null}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No recommendations available.</Text>}
      />

      <View style={styles.footerRow}>
        <Pressable style={styles.homeButton} onPress={() => router.replace('/') }>
          <Text style={styles.homeText}>Home</Text>
        </Pressable>
        <Pressable style={styles.startOver} onPress={() => router.replace('/start') }>
          <Text style={styles.startOverText}>Start Over</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  back: { position: 'absolute', left: 16, top: 44, zIndex: 20 },
  backText: { color: '#0f766e' },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: 8, marginBottom: 8, color: '#0f766e' },
  explanation: { color: '#444', textAlign: 'center', marginBottom: 12 },
  list: { flex: 1 },
  card: { padding: 12, borderRadius: 8, backgroundColor: '#f7faf9', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#064e3b' },
  cardReason: { color: '#333', marginTop: 6 },
  empty: { textAlign: 'center', color: '#999', marginTop: 20 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  homeButton: { padding: 12, backgroundColor: '#2a9d8f', borderRadius: 8 },
  homeText: { color: '#fff', fontWeight: '700' },
  startOver: { padding: 12, backgroundColor: '#e6fffa', borderRadius: 8 },
  startOverText: { color: '#064e3b', fontWeight: '700' },
});

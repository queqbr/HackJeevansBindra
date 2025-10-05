import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getIdentification } from '../lib/identificationStore';

type RecItem = { name?: string; reason?: string } | string;

// Timeout wrapper for fetch
async function fetchWithTimeout(url: string, options: any = {}, timeout = 15000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout))
  ]);
}

// OpenAI call
async function callOpenAIForRecommendations(identification: any, meta: any) {
  const key = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_KEY || '';
  const model = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_MODEL || 'gpt-3.5-turbo';
  if (!key) throw new Error('No OpenAI API key found. Make sure EXPO_PUBLIC_OPENAI_KEY is set in app config.');

  const prompt = `You are a friendly plant recommendation assistant. Identification result: ${JSON.stringify(identification)}. User answers: ${JSON.stringify(meta)}. Suggest up to 5 common plants (common names, include garden herbs/ornamentals when appropriate). For each plant provide a short, natural reason (1-2 short sentences) that ties the plant to user answers (sunlight, watering cadence, space, busy level, climate). Do NOT use awkward combined phrases like "busy lifestyle with daily watering needs"; instead pick a single matching attribute to emphasize per plant. Output ONLY a single valid JSON object with keys: recommendations (array of {name, reason}) and explanation (one short sentence). Example output:\n\n{\n  "recommendations": [\n    {"name": "Spider Plant", "reason": "Tolerates bright, indirect light and copes well with occasional missed waterings—great for a busy apartment."},\n    {"name": "Basil", "reason": "A compact culinary herb that thrives in sunny spots and weekly watering—perfect if you want an edible plant."}\n  ],\n  "explanation": "These picks match your sunlight and watering preferences."\n}`;

  const body = {
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a friendly, concise plant recommendation assistant. Write natural, conversational sentences for reasons (1–2 sentences each). Avoid awkward concatenations of unrelated attributes (for example, do NOT produce phrases like "busy lifestyle with daily watering needs"). Prioritize one clear reason per plant tied to the user answers (sunlight, watering, space, busyLevel, or climate). Ensure variety across categories (herb, succulent, flowering, foliage, trailing, large/outdoor) and avoid repeating the same plants across different requests.'
      },
      { role: 'user', content: prompt },
    ],
    // Give enough tokens for 5 detailed recommendations + explanation
    max_tokens: 700,
    // Stronger randomness and broader sampling to get more varied outputs across inputs
    temperature: 0.9,
    top_p: 0.95,
    // Stronger penalties to discourage repeating the same plants
    frequency_penalty: 1.0,
    presence_penalty: 0.6,
  };

  const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as Response;

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${text}`);
  }

  const j = await res.json();
  const choices = j?.choices || [];
  if (!choices.length) throw new Error('No choices returned from OpenAI');

  const msg = choices[0]?.message?.content || choices[0]?.text || '';
  try {
    return JSON.parse(msg);
  } catch {
    const m = msg.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Invalid JSON returned from OpenAI');
  }
}

export default function Recommendations() {
  const params = useLocalSearchParams<{ result?: string; meta?: string }>();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecommendations() {
      setLoading(true);
      setError(null);

      try {
        // Use passed params if available
        const identification = getIdentification() || { results: [] };
        const meta = params?.meta ? JSON.parse(params.meta) : {};

        const res = await callOpenAIForRecommendations(identification, meta);
        setResult(res);
      } catch (e: any) {
        console.error('[OpenAI] Error', e);
        setError(String(e?.message || e));
        setResult({ ok: false, recommendations: [], explanation: String(e?.message || e) });
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [params?.meta]);

  const recs: RecItem[] = result?.recommendations || [];

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Recommendations</Text>

      {loading ? (
        <View style={{ marginTop: 24 }}>
          <ActivityIndicator size="large" color="#0f766e" />
          <Text style={{ textAlign: 'center', marginTop: 8 }}>Loading recommendations…</Text>
        </View>
      ) : error ? (
        <Text style={[styles.explanation, { color: 'crimson' }]}>Error: {error}</Text>
      ) : result?.explanation ? (
        <Text style={styles.explanation}>{result.explanation}</Text>
      ) : null}

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
        <Pressable style={styles.homeButton} onPress={() => router.replace('/')}>
          <Text style={styles.homeText}>Home</Text>
        </Pressable>
        <Pressable style={styles.startOver} onPress={() => router.replace('/start')}>
          <Text style={styles.startOverText}>Start Over</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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

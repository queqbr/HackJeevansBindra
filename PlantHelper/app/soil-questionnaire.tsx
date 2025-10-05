import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { clearRecommendations, getIdentification, getRecommendations } from '../lib/identificationStore';

type Option = { value: string; label: string };

const QUESTIONS: { key: string; question: string; options: Option[] }[] = [
  { key: 'busyLevel', question: 'How busy are you?', options: [{ value: 'very', label: 'Very busy' }, { value: 'some', label: 'Some time' }, { value: 'not', label: 'Lots of time' }] },
  { key: 'sunlight', question: 'How much sunlight does the plant spot get?', options: [{ value: 'low', label: 'Low (shade)' }, { value: 'medium', label: 'Partial / Morning sun' }, { value: 'high', label: 'Full sun' }] },
  { key: 'watering', question: 'How often can you water plants?', options: [{ value: 'rare', label: 'Rarely' }, { value: 'weekly', label: 'Weekly' }, { value: 'daily', label: 'Daily' }] },
];

export default function SoilQuestionnaire() {
  const params = useLocalSearchParams<{ ml?: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mlResult, setMlResult] = useState<any | null>(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const mlParam = params?.ml;
        const identification = getIdentification() || {};

        let parsed: any = null;
        if (mlParam) {
          try { parsed = JSON.parse(mlParam); } catch { parsed = null; }
        }

        if (!parsed && identification && (identification.mlResult || identification.soil || identification.plant)) {
          parsed = identification.mlResult || { plantType: identification.plant, soilType: identification.soil };
        }

        // If parsed exists, store it; otherwise mlResult stays null.
        setMlResult(parsed || null);

        // If we have both plantType and soilType from ML, forward immediately.
        if (parsed && parsed.plantType && parsed.soilType) {
          const meta = { plantType: parsed.plantType, soilType: parsed.soilType, confidence: parsed.confidence || null };
          router.replace({ pathname: '/recommendations', params: { meta: JSON.stringify(meta) } } as any);
          return;
        }

        // Otherwise (soil-only, ML missing, or ML incomplete) show the questionnaire so the user can continue.
        setLoading(false);
      } catch (err: any) {
        setError(String(err?.message || err));
        setLoading(false);
      }
    }

    init();
  }, [params?.ml]);

  function choose(key: string, value: string) {
    setAnswers(a => ({ ...a, [key]: value }));
  }

  function submit() {
    const meta = { ...(mlResult || {}), ...answers };
    const precomputed = getRecommendations();
    if (precomputed) {
      const merged = { ...precomputed, meta };
      clearRecommendations();
      router.push({ pathname: '/recommendations', params: { result: JSON.stringify(merged), meta: JSON.stringify(meta) } } as any);
      return;
    }
    router.push({ pathname: '/recommendations', params: { meta: JSON.stringify(meta) } } as any);
  }

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Soil & Plant Compatibility</Text>
      <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#0f766e" />
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Soil & Plant Compatibility</Text>
      <Text style={{ color: 'crimson', marginTop: 12 }}>{error}</Text>
      <Pressable style={styles.retry} onPress={() => router.replace('/') }>
        <Text style={styles.retryText}>Go Home</Text>
      </Pressable>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentCenter}>
        <Text style={styles.title}>Quick questions</Text>
      {QUESTIONS.map(q => (
        <View key={q.key} style={styles.row}>
          <Text style={styles.q}>{q.question}</Text>
          <View style={styles.options}>
            {q.options.map(opt => (
              <Pressable key={opt.value} style={[styles.opt, answers[q.key] === opt.value ? styles.optActive : null]} onPress={() => choose(q.key, opt.value)}>
                <Text style={answers[q.key] === opt.value ? styles.optTextActive : styles.optText}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      </View>

      <Pressable style={styles.submit} onPress={submit}>
        <Text style={styles.submitText}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f766e', marginBottom: 12 },
  row: { marginBottom: 12 },
  q: { marginBottom: 8, fontWeight: '600' },
  options: { flexDirection: 'row', flexWrap: 'wrap' },
  opt: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginRight: 8, marginBottom: 8 },
  optActive: { backgroundColor: '#2a9d8f', borderColor: '#2a9d8f' },
  optText: { color: '#111' },
  optTextActive: { color: '#fff', fontWeight: '700' },
  submit: { marginTop: 12, padding: 12, backgroundColor: '#0f766e', borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700' },
  retry: { marginTop: 12, padding: 12, backgroundColor: '#2a9d8f', borderRadius: 8, alignItems: 'center' },
  retryText: { color: '#fff', fontWeight: '700' },
  contentCenter: { alignItems: 'center', marginTop: 36 },
});

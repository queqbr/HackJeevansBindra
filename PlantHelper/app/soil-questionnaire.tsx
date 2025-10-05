import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getIdentification } from '../lib/identificationStore';

type Option = { value: string; label: string };

const QUESTIONS: { key: string; question: string; options: Option[] }[] = [
  {
    key: 'busyLevel',
    question: 'How busy are you?',
    options: [
      { value: 'very', label: 'Very busy' },
      { value: 'some', label: 'Some time' },
      { value: 'not', label: 'Lots of time' },
    ],
  },
  {
    key: 'sunlight',
    question: 'How much sunlight does the plant spot get?',
    options: [
      { value: 'low', label: 'Low (shade)' },
      { value: 'medium', label: 'Partial / Morning sun' },
      { value: 'high', label: 'Full sun' },
    ],
  },
  {
    key: 'space',
    question: 'What is your garden / balcony size?',
    options: [
      { value: 'small', label: 'Small (balcony/pot)' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large (garden)' },
    ],
  },
  {
    key: 'watering',
    question: 'How often can you water plants?',
    options: [
      { value: 'rare', label: 'Rarely (once a week or less)' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'daily', label: 'Daily' },
    ],
  },
  {
    key: 'climate',
    question: 'Which best describes your climate?',
    options: [
      { value: 'temperate', label: 'Temperate' },
      { value: 'tropical', label: 'Tropical' },
      { value: 'dry', label: 'Dry / Arid' },
    ],
  },
];

export default function SoilQuestionnaire() {
  const params = useLocalSearchParams<{ uri?: string; identification?: string }>();
  const router = useRouter();
  const uri = params?.uri;
  const identificationRaw = params?.identification;
  const identificationParam = identificationRaw ? JSON.parse(identificationRaw) : null;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [animating, setAnimating] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const width = Dimensions.get('window').width;

  useEffect(() => {
    // prefill answers if needed in future
  }, []);

  function choose(option: Option) {
    if (animating) return;
    const key = QUESTIONS[index].key;
    // use a ref so we don't rely on possibly-stale 'answers' state
    const current = answersRef.current || {};
    const nextAnswers = { ...current, [key]: option.value };
    // update state and ref synchronously
    setAnswers(nextAnswers);
    answersRef.current = nextAnswers;

    if (index < QUESTIONS.length - 1) {
      // animate slide left
      setAnimating(true);
      const to = -(index + 1) * width;
      Animated.timing(anim, { toValue: to, duration: 250, useNativeDriver: true }).start(() => {
        setIndex((i) => i + 1);
        setAnimating(false);
      });
    } else {
      // last question answered -> don't auto-submit. Let the user press Submit.
      // we already updated answers and answersRef above.
    }
  }

  function goBack() {
    if (animating) return;
    if (index > 0) {
      // animate slide right
      setAnimating(true);
      Animated.timing(anim, { toValue: -(index - 1) * width, duration: 220, useNativeDriver: true }).start(() => {
        setIndex((i) => i - 1);
        setAnimating(false);
      });
    } else router.back();
  }

  async function submit(finalAnswers?: Record<string, string>) {
    setSubmitting(true);
    try {
      const meta = finalAnswers || answers;
      const identificationResult = getIdentification() || identificationParam || {};
      const payload = { identification: identificationResult, meta };
      const SERVER_URL = (process.env.EXPO_PUBLIC_SERVER_URL as string) || 'http://10.0.2.2:8000';
      const res = await fetch(`${SERVER_URL}/recommend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Status ${res.status}`);
      }
      const json = await res.json();
      // navigate to recommendations screen with result
      router.push({ pathname: '/recommendations', params: { result: JSON.stringify(json) } } as any);
    } catch (e: any) {
      // show inline error (could be improved)
      Alert.alert('Error', String(e.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  const q = QUESTIONS[index];

  return (
    <View style={[styles.container, { justifyContent: 'center' }]}>
      <Pressable style={styles.stickyBack} onPress={goBack}><Text>Back</Text></Pressable>

      <Text style={styles.title}>Quick questionnaire</Text>
      <View style={styles.progressBarWrap}>
        {/* use (index+1) so final question shows 100% */}
        <View style={[styles.progressBar, { width: `${Math.min(100, (((index + 1) / QUESTIONS.length) * 100))}%` }]} />
      </View>

      {uri ? <Image source={{ uri }} style={styles.image} /> : null}

      {/* viewport wrapper keeps only one slide hittable at a time */}
      <View style={{ width, overflow: 'hidden' }}>
        <Animated.View style={[styles.cardContainer, { transform: [{ translateX: anim }] }] }>
          {QUESTIONS.map((question, i) => (
            <View key={question.key} style={[styles.cardSlide, { width: width }]}>
              <Text style={styles.qText}>{question.question}</Text>
              {question.options.map((opt) => {
                const active = (answersRef.current && answersRef.current[question.key]) || answers[question.key];
                return (
                  <Pressable key={opt.value} disabled={animating} style={[styles.optButton, active === opt.value ? styles.optActive : null]} onPress={() => choose(opt)}>
                    <Text style={[styles.optText, active === opt.value ? styles.optTextActive : null]}>{opt.label}</Text>
                  </Pressable>
                );
              })}

              {/* show explicit submit on the last slide */}
              {i === QUESTIONS.length - 1 ? (
                <Pressable
                  disabled={animating || submitting}
                  style={[styles.submitButton, (animating || submitting) ? styles.submitButtonDisabled : null]}
                  onPress={() => submit((answersRef.current || answers))}
                >
                  <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
                </Pressable>
                ) : null}

              {i === QUESTIONS.length - 1 ? (
                <Text style={styles.submitNote}>Tap Submit when you're ready to see recommendations.</Text>
              ) : null}
            </View>
          ))}
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.progress}>{index + 1} / {QUESTIONS.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f766e', marginBottom: 6 },
  subtitle: { color: '#444', marginBottom: 12 },
  image: { width: '100%', height: 160, borderRadius: 8, marginBottom: 12 },
  card: { width: '100%', padding: 16, borderRadius: 12, backgroundColor: '#f7faf9', marginBottom: 12 },
  qText: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  optButton: { padding: 12, borderRadius: 8, backgroundColor: '#fff', marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  optActive: { backgroundColor: '#2a9d8f', borderColor: '#2a9d8f' },
  optText: { textAlign: 'center' },
  optTextActive: { color: '#fff', fontWeight: '700' },
  footer: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { padding: 10 },
  progress: { color: '#666' },
  stickyBack: { position: 'absolute', left: 12, top: 44, zIndex: 20 },
  progressBarWrap: { width: '100%', height: 6, backgroundColor: '#eee', borderRadius: 6, marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: '#2a9d8f', borderRadius: 6 },
  cardContainer: { flexDirection: 'row' },
  cardSlide: { padding: 8 },
  submitButton: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: '#0f766e', width: '100%' , alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#96c6bf' },
  submitText: { color: '#fff', fontWeight: '700' },
  submitNote: { color: '#444', textAlign: 'center', marginTop: 8 },
});

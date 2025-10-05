import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { setIdentification, setRecommendations } from '../lib/identificationStore';

export default function Preview() {
  const params = useLocalSearchParams<{ uri?: string; uri2?: string }>();
  const router = useRouter();
  const [displayUri, setDisplayUri] = useState<string | undefined>(params?.uri);
  const [uploading, setUploading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    setDisplayUri(params?.uri);
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, [params?.uri]);

  function confirm() {
    // upload displayed images to the inference server and show the response
    if (uploading) return;
    // start upload in background, but navigate immediately
    setUploading(true);
    uploadAndIdentify().catch((err) => {
      console.error(err);
      Alert.alert('Upload failed', String(err));
    });
    router.push({ pathname: '/soil-questionnaire' } as any);
  }

  // Configure this via environment or replace with your server address (ngrok or local IP).
  // Expo: you can set EXPO_PUBLIC_SERVER_URL in app config or use a runtime constant.
  const SERVER_URL = (process.env.EXPO_PUBLIC_SERVER_URL as string) || 'http://10.0.2.2:8000';

  async function uriToFormDataEntry(uri: string, fieldName = 'files') {
    // React Native/FormData accepts objects with { uri, name, type }
    const filename = uri.split('/').pop() || `${Date.now()}.jpg`;
    const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
    const type = extMatch ? `image/${extMatch[1].toLowerCase()}` : 'image/jpeg';

    // Some iOS URIs use the ph:// scheme which fetch can't directly consume as a file in FormData.
    // The easy, broadly compatible approach is to fetch the URI and convert to blob.
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return { fieldName, blob, name: filename, type };
    } catch (e) {
      // Fallback: append uri directly (Expo handles file:// on many devices)
      return { fieldName, uri, name: filename, type };
    }
  }

  async function uploadAndIdentify() {
    if (uploading) return;
    if (!uri && !uri2) {
      if (mountedRef.current) setUploading(false);
      Alert.alert('No image', 'There is no image to identify');
      return;
    }

    // no preflight health check — proceed directly to upload

    const formData = new FormData();

    const appendEntry = async (u: string | undefined) => {
      if (!u) return;
      const entry = await uriToFormDataEntry(u);
      // if we got a blob, append that; otherwise append the RN file object
      if ((entry as any).blob) {
        formData.append('files', entry.blob as any, entry.name);
      } else {
        formData.append('files', { uri: entry.uri, name: entry.name, type: entry.type } as any);
      }
    };

    await appendEntry(uri);
    if (uri2) await appendEntry(uri2);

    // add a failsafe timeout so the app doesn't hang waiting for a slow server
  const TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_PREDICT_TIMEOUT) || 30000;
    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${SERVER_URL}/predict`, {
        method: 'POST',
        body: formData,
        signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        // ensure we set identification to null so waiting code proceeds
        setIdentification(null);
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      const json = await res.json();
      // store identification result so the questionnaire can read it when ready
      setIdentification(json);
      // after identification completes, automatically request recommendations
      // and navigate to the recommendations screen so the user sees the final results.
      try {
        const recRes = await fetch(`${SERVER_URL}/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identification: json, meta: {} }),
        });
        if (recRes.ok) {
          const recJson = await recRes.json();
          // store recommendations so the questionnaire can include answers and navigate on Submit
          try { setRecommendations(recJson); } catch (e) { console.warn('Failed to set recommendations', e); }
        } else {
          const txt = await recRes.text();
          console.warn('Recommend call failed', recRes.status, txt);
        }
      } catch (err) {
        console.warn('Recommend request error', err);
      }
    } catch (e: any) {
      // On abort or any error, set identification to null so questionnaire continues
      if (e && e.name === 'AbortError') {
        console.warn('Predict request aborted due to timeout');
      } else {
        console.error('Predict error', e);
      }
      try { setIdentification(null); } catch {}
    } finally {
      clearTimeout(timeout);
      if (mountedRef.current) setUploading(false);
    }
  }

  const { uri, uri2 } = params || ({} as any);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Preview</Text>

      {displayUri ? (
        <Image source={{ uri: displayUri }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No image to preview</Text>
        </View>
      )}

      {uri2 ? (
        <View style={styles.thumbsRow}>
          <Pressable onPress={() => setDisplayUri(uri)} style={styles.thumbWrap}>
            <Image source={{ uri }} style={[styles.thumb, displayUri === uri ? styles.thumbActive : null]} />
            <Text style={styles.thumbLabel}>Soil</Text>
          </Pressable>
          <Pressable onPress={() => setDisplayUri(uri2)} style={styles.thumbWrap}>
            <Image source={{ uri: uri2 }} style={[styles.thumb, displayUri === uri2 ? styles.thumbActive : null]} />
            <Text style={styles.thumbLabel}>Plant</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.row}>
        <Pressable style={[styles.button, { backgroundColor: '#2a9d8f' }]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
        <Pressable style={[styles.button, { backgroundColor: '#2a9d8f', opacity: uploading ? 0.6 : 1 }]} onPress={confirm} disabled={uploading}>
          <Text style={styles.buttonText}>{uploading ? 'Uploading...' : 'Confirm'}</Text>
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
  thumbsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  thumbWrap: { alignItems: 'center' },
  thumb: { width: 64, height: 64, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: '#2a9d8f' },
  thumbLabel: { fontSize: 12, color: '#333', marginTop: 4, textAlign: 'center' },
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

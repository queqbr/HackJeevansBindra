import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';


export default function Start() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<'single' | 'double-soil' | 'double-plant' | null>(null);
  const [soilUriTemp, setSoilUriTemp] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>How would you like to begin?</Text>
        <View style={styles.buttons}>
          <Pressable style={styles.card} onPress={() => { setMode('single'); setModalVisible(true); }}>
            <Text style={styles.cardTitle}>Find what to grow</Text>
            <Text style={styles.cardText}>Upload soil photo + answer quick lifestyle questions.</Text>
          </Pressable>

          <Pressable style={styles.card} onPress={() => { setMode('double-soil'); setModalVisible(true); setSoilUriTemp(null); }}>
            <Text style={styles.cardTitle}>Soil & plant compatibility</Text>
            <Text style={styles.cardText}>Upload soil and plant photos to check compatibility.</Text>
          </Pressable>
        </View>
      </View>

      {/* Modal chooser: Take Photo / Choose from Library */}
      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => { if (!busy) setModalVisible(false); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{mode === 'single' ? 'Upload soil photo' : mode === 'double-soil' ? 'Upload soil photo' : 'Upload plant photo'}</Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButton}
                onPress={async () => {
                  if (busy) return;
                  setBusy(true);
                  try {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') return;
                    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
                    if (res.canceled || !res.assets || res.assets.length === 0) return;
                    const uri = res.assets[0].uri;
                    if (mode === 'single') {
                      setModalVisible(false);
                      router.push({ pathname: '/preview', params: { uri } } as any);
                    } else if (mode === 'double-soil') {
                      // store soil and prompt for plant
                      setSoilUriTemp(uri);
                      setMode('double-plant');
                    } else if (mode === 'double-plant') {
                      setModalVisible(false);
                      router.push({ pathname: '/preview', params: { uri: soilUriTemp, uri2: uri } } as any);
                    }
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Take Photo</Text>
              </Pressable>

              <Pressable
                style={styles.modalButton}
                onPress={async () => {
                  if (busy) return;
                  setBusy(true);
                  try {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') return;
                    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
                    if (res.canceled || !res.assets || res.assets.length === 0) return;
                    const uri = res.assets[0].uri;
                    if (mode === 'single') {
                      setModalVisible(false);
                      router.push({ pathname: '/preview', params: { uri } } as any);
                    } else if (mode === 'double-soil') {
                      setSoilUriTemp(uri);
                      setMode('double-plant');
                    } else if (mode === 'double-plant') {
                      setModalVisible(false);
                      router.push({ pathname: '/preview', params: { uri: soilUriTemp, uri2: uri } } as any);
                    }
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Choose from Library</Text>
              </Pressable>
            </View>

            <View style={styles.modalFooter}>
              {busy ? <ActivityIndicator /> : (
                <Pressable onPress={() => { if (!busy) { setModalVisible(false); setMode(null); setSoilUriTemp(null); } }}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center', color: '#0f766e' },
  buttons: { gap: 16 },
  card: { backgroundColor: '#f7faf9', padding: 18, borderRadius: 12, marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  cardText: { color: '#555' },

  // modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '86%', backgroundColor: '#fff', padding: 18, borderRadius: 12, elevation: 6 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  modalButtons: { flexDirection: 'column', gap: 10 },
  modalButton: { backgroundColor: '#0f766e', padding: 12, borderRadius: 8, marginBottom: 8 },
  modalButtonText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  modalFooter: { marginTop: 8, alignItems: 'center' },
  modalCancel: { color: '#0f766e', fontWeight: '600' },
});

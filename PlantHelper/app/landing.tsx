import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

const SLIDES = [
  {
    key: 'welcome',
    title: 'Welcome to \nA Helping Hand',
    text: 'Kickstart your gardening journey with ease.',
    image: require('../assets/images/helpinghandimage copy.png'),
  },
  {
    key: 'soil-lifestyle',
    title: 'No Idea What To Grow?',
    text: 'Upload a photo of your soil and answer a few quick lifestyle questions (light, watering habits, time at home) so we can recommend plants that fit your routine.',
    image: require('../assets/images/confusedgirl.jpg'),
  },
  {
    key: 'compatibility-check',
    title: 'Will It Thrive?',
    text: 'Upload a picture of your soil and a picture of a plant to check whether the plant will thrive in that soil — quick compatibility results help you avoid mismatches.',
    image: require('../assets/images/plantgrowing.jpg'),
  },
  {
    key: 'get-started',
    title: 'Get Started',
    text: "We're here to help you jump into the world of gardening.",
    image: require('../assets/images/trowel.jpg'),
  },
];

export default function Landing() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  // use a permissive ref so we can call scrollTo on the ScrollView
  const scrollRef = useRef<ScrollView | null>(null);
  const [index, setIndex] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  };

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  const next = () => {
    if (index < SLIDES.length - 1) goTo(index + 1);
    else router.push({ pathname: '/start' } as any);
  };

  const skip = () => {
    // Navigate to the start chooser screen
    router.push({ pathname: '/start' } as any);
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
          contentContainerStyle={{ alignItems: 'center' }}
          style={{ flex: 1 }}
        >
          {SLIDES.map((slide, i) => {
            return (
              <View style={[styles.slide, { width }]} key={slide.key}>
                <View style={styles.slideContent}>
                  <View style={styles.imageWrap}>
                    <RNImage source={slide.image} style={styles.image} resizeMode="contain" />
                  </View>

                  <View style={styles.textWrap}>
                    <Text style={styles.slideTitle}>{slide.title}</Text>
                    <Text style={styles.slideText}>{slide.text}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer} pointerEvents="box-none">
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View key={`dot-${i}`} style={[styles.dot, i === index ? styles.dotActive : null]} />
            ))}
          </View>

          <View style={styles.buttonsRow}>
            <Pressable onPress={skip} style={styles.linkButton}>
              <Text style={styles.linkText}>Skip</Text>
            </Pressable>

            <Pressable onPress={next} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {index === SLIDES.length - 1 ? 'Get Started' : 'Next'}
              </Text>
            </Pressable>
          </View>
          {/* debug UI removed */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 0,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  imageWrap: {
    width: 260,
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  marginBottom: 8,
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textWrap: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  slideTitle: {
    fontSize: 40,
    color: '#2a9d8f',
    fontWeight: '700',
  marginBottom: 4,
    textAlign: 'center',
  },
  slideText: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#333',
    marginHorizontal: 6,
  },
  dotActive: {
    backgroundColor: '#2a9d8f',
    width: 12,
    height: 12,
    borderRadius: 12,
  },
  // slideContent centered
  slideContent: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -50 }],
  },
  // debug styles removed
  // debug styles removed
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  linkText: {
    color: '#666',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#2a9d8f',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { X, Heart, PartyPopper } from "lucide-react-native";
import { colors } from "@/lib/colors";

const SWIPE_THRESHOLD = 100;
const EXIT_DISTANCE = 500;

export default function SwipeDeck<T>({
  items,
  getKey,
  renderCard,
  onSwipe,
  emptyState,
}: {
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
  onSwipe: (
    item: T,
    direction: "like" | "pass"
  ) => void | boolean | Promise<void | boolean>;
  emptyState: React.ReactNode;
}) {
  const [matchItem, setMatchItem] = useState<T | null>(null);
  const [trigger, setTrigger] = useState<"like" | "pass" | null>(null);

  const handleSwipe = async (item: T, direction: "like" | "pass") => {
    const result = await onSwipe(item, direction);
    if (direction === "like" && result !== false) {
      setMatchItem(item);
    }
  };

  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  const visible = items.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.deck}>
        {visible
          .slice()
          .reverse()
          .map((item, revIdx) => {
            const idx = visible.length - 1 - revIdx;
            const isTop = idx === 0;
            return (
              <SwipeCard
                key={getKey(item)}
                isTop={isTop}
                depth={idx}
                trigger={isTop ? trigger : null}
                onTriggerConsumed={() => setTrigger(null)}
                onSwipe={(direction) => handleSwipe(item, direction)}
              >
                {renderCard(item)}
              </SwipeCard>
            );
          })}
      </View>

      {items[0] && (
        <View style={styles.actions}>
          <Pressable
            onPress={() => setTrigger("pass")}
            style={[styles.actionButton, styles.passButton]}
          >
            <X size={24} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => setTrigger("like")}
            style={[styles.actionButton, styles.likeButton]}
          >
            <Heart size={24} color="#fff" fill="#fff" />
          </Pressable>
        </View>
      )}

      <Modal visible={!!matchItem} transparent animationType="fade">
        <Pressable
          style={styles.matchOverlay}
          onPress={() => setMatchItem(null)}
        >
          <PartyPopper color={colors.pink} size={56} />
          <Text style={styles.matchTitle}>It&apos;s a Match!</Text>
          <Text style={styles.matchSubtitle}>
            You liked it — find it in your Matches or Chat tab.
          </Text>
          <Pressable
            onPress={() => setMatchItem(null)}
            style={styles.matchButton}
          >
            <Text style={styles.matchButtonText}>Keep Swiping</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SwipeCard({
  children,
  isTop,
  depth,
  trigger,
  onTriggerConsumed,
  onSwipe,
}: {
  children: React.ReactNode;
  isTop: boolean;
  depth: number;
  trigger: "like" | "pass" | null;
  onTriggerConsumed: () => void;
  onSwipe: (direction: "like" | "pass") => void;
}) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!trigger) return;
    const toX = trigger === "like" ? EXIT_DISTANCE : -EXIT_DISTANCE;
    // Reanimated shared values are mutated via .value by design — the
    // react-hooks/immutability rule doesn't know this hook is an exception.
    // eslint-disable-next-line react-hooks/immutability
    translateX.value = withTiming(toX, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onSwipe)(trigger);
    });
    onTriggerConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      // eslint-disable-next-line react-hooks/immutability
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        // eslint-disable-next-line react-hooks/immutability
        translateX.value = withTiming(
          EXIT_DISTANCE,
          { duration: 300 },
          (finished) => {
            if (finished) runOnJS(onSwipe)("like");
          }
        );
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(
          -EXIT_DISTANCE,
          { duration: 300 },
          (finished) => {
            if (finished) runOnJS(onSwipe)("pass");
          }
        );
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: depth * 10 },
      { scale: 1 - depth * 0.05 },
      { rotate: `${translateX.value / 15}deg` },
    ],
    opacity: depth === 2 ? 0 : 1,
    zIndex: 10 - depth,
  }));

  const card = (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      {children}
    </Animated.View>
  );

  if (!isTop) return card;

  return <GestureDetector gesture={pan}>{card}</GestureDetector>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  deck: {
    flex: 1,
    width: "100%",
  },
  cardWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 20,
  },
  actionButton: {
    height: 56,
    width: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  passButton: {
    backgroundColor: colors.surfaceAlt,
  },
  likeButton: {
    backgroundColor: colors.pink,
  },
  matchOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  matchTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.pink,
  },
  matchSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
  matchButton: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: colors.pink,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  matchButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

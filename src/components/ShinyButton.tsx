import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableWithoutFeedback, View, type LayoutChangeEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, shadow } from "@/lib/theme";

const BAND_WIDTH = 70;
const SWEEP_MS = 1100;
const PAUSE_MS = 900;

// JSX like `+ {t.x.addButton}` passes children as an array of separate
// string nodes (the literal "+ " and the expression's result), not one
// combined string — so a plain `typeof children === "string"` check misses
// it and the raw strings get rendered outside a <Text>, where React Native
// silently drops them (blank button, no error).
function isTextContent(children: ReactNode): boolean {
  const items = Array.isArray(children) ? children : [children];
  return items.length > 0 && items.every((c) => typeof c === "string" || typeof c === "number");
}

export function ShinyButton({
  children,
  onPress,
  disabled,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: object;
}) {
  const [width, setWidth] = useState(0);
  const translateX = useRef(new Animated.Value(-BAND_WIDTH)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!width || disabled) {
      loopRef.current?.stop();
      return;
    }
    translateX.setValue(-BAND_WIDTH);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: width + BAND_WIDTH,
          duration: SWEEP_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(PAUSE_MS),
        Animated.timing(translateX, { toValue: -BAND_WIDTH, duration: 0, useNativeDriver: true }),
      ])
    );
    loopRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, [width, disabled, translateX]);

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  function pressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }

  return (
    <TouchableWithoutFeedback onPress={disabled ? undefined : onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        onLayout={onLayout}
        style={[
          styles.button,
          shadow.glow,
          disabled && styles.disabled,
          { transform: [{ scale }] },
          style,
        ]}
      >
        {width > 0 && !disabled && (
          <Animated.View
            pointerEvents="none"
            style={[styles.bandWrap, { transform: [{ translateX }, { rotate: "20deg" }] }]}
          >
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.55)", "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.band}
            />
          </Animated.View>
        )}
        <View style={styles.content}>{isTextContent(children) ? <Text style={styles.label}>{children}</Text> : children}</View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  disabled: { opacity: 0.5 },
  content: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  label: { color: colors.bg, fontSize: 14, fontWeight: "700" },
  bandWrap: {
    position: "absolute",
    top: -40,
    bottom: -40,
    width: BAND_WIDTH,
  },
  band: { flex: 1, width: BAND_WIDTH },
});

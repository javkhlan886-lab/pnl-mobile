import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, shadow } from "@/lib/theme";
import { useLocale } from "@/lib/i18n";

export default function MoreScreen() {
  const { t } = useLocale();

  const items = [
    { label: t.nav.workforce, sub: t.workforce.subtitle, icon: "hammer" as const, path: "/workforce" as const },
    { label: t.nav.partners, sub: t.partners.subtitle, icon: "people-circle" as const, path: "/partners" as const },
  ];

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.more.title} subtitle={t.more.subtitle} />
      <View style={styles.list}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.path}
            style={[styles.card, shadow.card]}
            activeOpacity={0.75}
            onPress={() => router.push(item.path)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Text style={styles.cardSub}>{item.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  cardSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
});

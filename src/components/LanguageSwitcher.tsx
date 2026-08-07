import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocale, type Locale } from "@/lib/i18n";
import { colors } from "@/lib/theme";

const OPTIONS: { code: Locale; label: string; flag: string }[] = [
  { code: "mn", label: "MN", flag: "🇲🇳" },
  { code: "en", label: "EN", flag: "🇺🇸" },
  { code: "ko", label: "KO", flag: "🇰🇷" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = opt.code === locale;
        return (
          <TouchableOpacity
            key={opt.code}
            onPress={() => setLocale(opt.code)}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.7}
          >
            <Text style={styles.flag}>{opt.flag}</Text>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: colors.cardAlt,
    borderRadius: 999,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipActive: { backgroundColor: "rgba(52,211,153,0.18)" },
  flag: { fontSize: 13 },
  chipText: { fontSize: 11, fontWeight: "700", color: colors.muted },
  chipTextActive: { color: colors.positive },
});

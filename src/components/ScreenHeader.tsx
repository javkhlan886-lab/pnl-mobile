import type { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/lib/i18n";
import { colors, shadow } from "@/lib/theme";
import { useResponsive } from "@/hooks/useResponsive";
import { LiveDot } from "./LiveDot";

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { logout } = useAuth();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.headerText}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <LiveDot />
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
        <Text style={styles.logoutText}>{t.common.logout}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function StatCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  const { statCardBasis } = useResponsive();
  return (
    <View style={[styles.statCard, shadow.card, { flexBasis: statCardBasis }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone ? { color: tone } : null]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 1 },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  statCard: {
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statLabel: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.text },
  statSub: { fontSize: 11, color: colors.muted, marginTop: 4 },
});

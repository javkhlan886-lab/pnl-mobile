import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { getPnlList, getSummary, type PnlRecord, type Summary } from "@/lib/pnl";
import { fmt } from "@/lib/format";
import { useLocale } from "@/lib/i18n";
import { colors, shadow } from "@/lib/theme";
import { LiveDot } from "@/components/LiveDot";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { StatCard } from "@/components/ScreenHeader";
import { PaymentCard } from "@/components/PaymentCard";

const AVATAR_COLORS = ["#22c55e", "#38bdf8", "#818cf8", "#f59e0b", "#f472b6", "#2dd4bf"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 9973;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function DashboardScreen() {
  const { user, company, logout } = useAuth();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<PnlRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, sum] = await Promise.all([
        getPnlList().catch(() => []),
        getSummary().catch(() => null),
      ]);
      setRecords(list);
      setSummary(sum);
    } catch {
      setError(t.dashboard.loadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  const netProfit = (r: PnlRecord) =>
    r.incomeRows.reduce((s, x) => s + Number(x.amount ?? 0), 0) -
    r.expenseRows.reduce((s, x) => s + Number(x.amount ?? 0), 0);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topRow}>
          <View style={[styles.avatar, { backgroundColor: avatarColor(company?.name ?? "?") }]}>
            <Text style={styles.avatarText}>{initials(company?.name ?? t.dashboard.companyFallback)}</Text>
          </View>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {company?.name ?? t.dashboard.companyFallback}
              </Text>
              <LiveDot />
            </View>
            <Text style={styles.subtitle} numberOfLines={1}>
              {t.dashboard.greeting} {user?.name}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.bottomRow}>
          <LanguageSwitcher />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            <>
              <PaymentCard />
              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              {summary && (
                <View style={styles.statsGrid}>
                  <StatCard label={t.dashboard.statIncome} value={fmt(summary.pnlIncome)} tone={colors.positive} />
                  <StatCard label={t.dashboard.statExpense} value={fmt(summary.totalOperatingExpense)} tone={colors.negative} />
                  <StatCard label={t.dashboard.statNetProfit} value={fmt(summary.netProfit)} tone={colors.positive} />
                  <StatCard label={t.dashboard.statMargin} value={`${summary.margin ?? 0}%`} tone={colors.info} />
                </View>
              )}
              <Text style={styles.sectionTitle}>{t.dashboard.reports}</Text>
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t.dashboard.noRecords}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const profit = netProfit(item);
            return (
              <View style={[styles.recordCard, shadow.card]}>
                <Text style={styles.recordName}>{item.company || "—"}</Text>
                {item.contractNumber && <Text style={styles.recordMeta}>{item.contractNumber}</Text>}
                <Text style={[styles.recordProfit, { color: profit >= 0 ? colors.positive : colors.negative }]}>
                  {profit >= 0 ? "+" : "-"}{fmt(Math.abs(profit))}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800", color: colors.bg },
  headerText: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flexShrink: 1, fontSize: 18, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottomRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  listContent: { padding: 20 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 10 },
  recordCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  recordName: { fontSize: 15, fontWeight: "600", color: colors.text },
  recordMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  recordProfit: { fontSize: 16, fontWeight: "700", marginTop: 8 },
  emptyText: { color: colors.muted, fontSize: 14 },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderColor: "rgba(239,68,68,0.35)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  errorText: { color: "#fca5a5", fontSize: 13 },
});

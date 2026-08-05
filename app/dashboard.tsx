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
import { useAuth } from "@/hooks/useAuth";
import { getPnlList, getSummary, type PnlRecord, type Summary } from "@/lib/pnl";
import { fmt } from "@/lib/format";

export default function DashboardScreen() {
  const { user, company, logout } = useAuth();
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
      setError("Дата ачаалахад алдаа гарлаа.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{company?.name ?? "Компани"}</Text>
          <Text style={styles.subtitle}>Сайн байна уу, {user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Гарах</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
          ListHeaderComponent={
            <>
              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              {summary && (
                <View style={styles.statsGrid}>
                  <StatCard label="Нийт орлого" value={fmt(summary.pnlIncome)} tone="#22c55e" />
                  <StatCard label="Нийт зарлага" value={fmt(summary.totalOperatingExpense)} tone="#f87171" />
                  <StatCard label="Цэвэр ашиг" value={fmt(summary.netProfit)} tone="#22c55e" />
                  <StatCard label="Маржин" value={`${summary.margin ?? 0}%`} tone="#38bdf8" />
                </View>
              )}
              <Text style={styles.sectionTitle}>Тайлангууд</Text>
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Тайлан алга байна.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const profit = netProfit(item);
            return (
              <View style={styles.recordCard}>
                <Text style={styles.recordName}>{item.company || "—"}</Text>
                {item.contractNumber && <Text style={styles.recordMeta}>{item.contractNumber}</Text>}
                <Text style={[styles.recordProfit, { color: profit >= 0 ? "#22c55e" : "#f87171" }]}>
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

function StatCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b1220",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2b45",
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: "700", color: "#f8fafc" },
  subtitle: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1f2b45",
  },
  logoutText: { color: "#f8fafc", fontSize: 13, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  listContent: { padding: 20 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#111a2e",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1f2b45",
  },
  statLabel: { fontSize: 12, color: "#94a3b8", marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: "700" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#f8fafc", marginBottom: 10 },
  recordCard: {
    backgroundColor: "#111a2e",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1f2b45",
  },
  recordName: { fontSize: 15, fontWeight: "600", color: "#f8fafc" },
  recordMeta: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  recordProfit: { fontSize: 16, fontWeight: "700", marginTop: 8 },
  emptyText: { color: "#94a3b8", fontSize: 14 },
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

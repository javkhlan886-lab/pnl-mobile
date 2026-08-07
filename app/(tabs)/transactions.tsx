import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenHeader, StatCard } from "@/components/ScreenHeader";
import { FormModal, Field, ChipGroup } from "@/components/FormModal";
import { TextField, MoneyField } from "@/components/Inputs";
import { ShinyButton } from "@/components/ShinyButton";
import { colors, shadow } from "@/lib/theme";
import { fmt, formatDate } from "@/lib/format";
import { useLocale, format } from "@/lib/i18n";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  CATEGORIES_INCOME,
  CATEGORIES_EXPENSE,
  type Transaction,
  type TransactionInput,
} from "@/lib/transactions";

function emptyForm(): TransactionInput {
  return {
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: 0,
    type: "income",
    category: CATEGORIES_INCOME[0],
    contractNumber: "",
    note: "",
    currency: "₮",
    status: "approved",
  };
}

export default function TransactionsScreen() {
  const { t } = useLocale();
  const [items, setItems] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, incomeCount: 0, expenseCount: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"" | "income" | "expense">("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<TransactionInput>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getTransactions({ type: typeFilter || undefined, limit: 50 });
      setItems(data.transactions);
      setSummary(data.summary);
    } catch {
      Alert.alert(t.common.errorGeneric);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(tx: Transaction) {
    setEditing(tx._id);
    setForm({ ...tx, date: formatDate(tx.date) });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.description.trim() || form.amount <= 0) return;
    setSaving(true);
    try {
      const payload = { ...form, contractNumber: form.contractNumber?.trim().toUpperCase() };
      if (editing) {
        await updateTransaction(editing, payload);
      } else {
        await createTransaction(payload);
      }
      setOpen(false);
      load();
    } catch {
      Alert.alert(t.common.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(tx: Transaction) {
    Alert.alert(t.common.deleteConfirmTitle, format(t.transactions.deleteConfirm, { name: tx.description }), [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: async () => {
          await deleteTransaction(tx._id);
          load();
        },
      },
    ]);
  }

  const categories = form.type === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;
  const net = summary.totalIncome - summary.totalExpense;

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.transactions.title} subtitle={t.transactions.subtitle} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <>
              <View style={styles.statsGrid}>
                <StatCard label={t.transactions.statIncome} value={fmt(summary.totalIncome)} tone={colors.positive} sub={format(t.transactions.statIncomeSub, { count: String(summary.incomeCount) })} />
                <StatCard label={t.transactions.statExpense} value={fmt(summary.totalExpense)} tone={colors.negative} sub={format(t.transactions.statIncomeSub, { count: String(summary.expenseCount) })} />
                <StatCard label={t.transactions.statNet} value={`${net >= 0 ? "+" : "-"}${fmt(Math.abs(net))}`} tone={net >= 0 ? colors.positive : colors.negative} />
              </View>
              <View style={styles.filterRow}>
                {(["", "income", "expense"] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setTypeFilter(f)}
                    style={[styles.filterChip, typeFilter === f && styles.filterChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, typeFilter === f && styles.filterChipTextActive]}>
                      {f === "" ? t.common.all : f === "income" ? t.transactions.typeIncome : t.transactions.typeExpense}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <ShinyButton onPress={openCreate} style={styles.addButton}>
                + {t.transactions.addButton}
              </ShinyButton>
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t.transactions.empty}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, shadow.card]} activeOpacity={0.75} onPress={() => openEdit(item)} onLongPress={() => confirmDelete(item)}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.description}</Text>
                  <Text style={styles.cardMeta}>
                    {formatDate(item.date)} · {item.category}
                    {item.contractNumber ? ` · ${item.contractNumber}` : ""}
                  </Text>
                </View>
              </View>
              <Text style={[styles.cardAmount, { color: item.type === "income" ? colors.positive : colors.negative }]}>
                {item.type === "income" ? "+" : "-"}{fmt(item.amount)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <FormModal
        visible={open}
        onClose={() => setOpen(false)}
        title={editing ? t.transactions.editTitle : t.transactions.addTitle}
        footer={
          <>
            <TouchableOpacity style={styles.footerBtnOutline} onPress={() => setOpen(false)} activeOpacity={0.7}>
              <Text style={styles.footerBtnOutlineText}>{t.common.cancel}</Text>
            </TouchableOpacity>
            <ShinyButton
              onPress={handleSave}
              disabled={!form.description.trim() || form.amount <= 0 || saving}
              style={styles.footerBtn}
            >
              {saving ? t.common.saving : t.common.save}
            </ShinyButton>
          </>
        }
      >
        <Field label={t.transactions.fieldType}>
          <ChipGroup
            options={["income", "expense"] as const}
            value={form.type}
            onChange={(v) =>
              setForm((f) => ({ ...f, type: v, category: v === "income" ? CATEGORIES_INCOME[0] : CATEGORIES_EXPENSE[0] }))
            }
            labels={{ income: t.transactions.typeIncome, expense: t.transactions.typeExpense }}
          />
        </Field>
        <Field label={t.transactions.fieldDate}>
          <TextField value={form.date} onChangeText={(v) => setForm((f) => ({ ...f, date: v }))} placeholder="YYYY-MM-DD" />
        </Field>
        <Field label={t.transactions.fieldAmount}>
          <MoneyField value={form.amount} onChangeValue={(v) => setForm((f) => ({ ...f, amount: v }))} />
        </Field>
        <Field label={t.transactions.fieldDescription}>
          <TextField value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} />
        </Field>
        <Field label={t.transactions.fieldCategory}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ChipGroup options={categories} value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} />
          </ScrollView>
        </Field>
        <Field label={t.transactions.fieldContract}>
          <TextField
            value={form.contractNumber}
            onChangeText={(v) => setForm((f) => ({ ...f, contractNumber: v.toUpperCase() }))}
            placeholder={t.transactions.fieldContractPlaceholder}
            autoCapitalize="characters"
          />
        </Field>
        <Field label={t.transactions.fieldNote}>
          <TextField value={form.note} onChangeText={(v) => setForm((f) => ({ ...f, note: v }))} placeholder={t.transactions.fieldNotePlaceholder} />
        </Field>
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  listContent: { padding: 16, paddingBottom: 32 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: "rgba(52,211,153,0.15)", borderColor: "rgba(52,211,153,0.4)" },
  filterChipText: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  filterChipTextActive: { color: colors.positive },
  addButton: { marginBottom: 14 },
  emptyText: { color: colors.muted, fontSize: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  cardMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  cardAmount: { fontSize: 16, fontWeight: "700", marginTop: 10 },
  footerBtn: { flex: 1 },
  footerBtnOutline: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  footerBtnOutlineText: { color: colors.text, fontWeight: "600", fontSize: 14 },
});

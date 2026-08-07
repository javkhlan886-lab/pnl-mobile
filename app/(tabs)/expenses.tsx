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
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  OFFICE_CATS,
  OTHER_CATS,
  type Expense,
  type ExpenseInput,
} from "@/lib/expenses";

function emptyForm(): ExpenseInput {
  return {
    type: "office",
    category: OFFICE_CATS[0],
    description: "",
    unitPrice: 0,
    quantity: 1,
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    status: "pending",
    note: "",
  };
}

export default function ExpensesScreen() {
  const { t } = useLocale();
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"" | "office" | "other">("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseInput>(emptyForm());
  const [saving, setSaving] = useState(false);

  const STATUS_LABEL: Record<Expense["status"], string> = {
    approved: t.expenses.statusApproved,
    pending: t.expenses.statusPending,
    rejected: t.expenses.statusRejected,
  };
  const STATUS_TONE: Record<Expense["status"], string> = {
    approved: colors.positive,
    pending: colors.warn,
    rejected: colors.negative,
  };

  const load = useCallback(async () => {
    try {
      setItems(await getExpenses());
    } catch {
      Alert.alert(t.common.errorGeneric);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = typeFilter ? items.filter((e) => e.type === typeFilter) : items;
  const totalApproved = filtered.filter((e) => e.status === "approved").reduce((s, e) => s + e.amount, 0);
  const totalPending = filtered.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(e: Expense) {
    setEditing(e._id);
    setForm({ ...e, date: formatDate(e.date) });
    setOpen(true);
  }
  function setUnitPriceAndQty(unitPrice: number, quantity: number) {
    setForm((f) => ({ ...f, unitPrice, quantity, amount: unitPrice * quantity }));
  }

  async function handleSave() {
    if (!form.description.trim() || form.unitPrice * form.quantity === 0) return;
    setSaving(true);
    try {
      const payload = { ...form, amount: form.unitPrice * form.quantity };
      if (editing) {
        const updated = await updateExpense(editing, payload);
        setItems((prev) => prev.map((e) => (e._id === editing ? updated : e)));
      } else {
        const created = await createExpense(payload);
        setItems((prev) => [created, ...prev]);
      }
      setOpen(false);
    } catch {
      Alert.alert(t.common.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(e: Expense) {
    Alert.alert(t.common.deleteConfirmTitle, format(t.expenses.deleteConfirm, { name: e.description }), [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: async () => {
          await deleteExpense(e._id);
          setItems((prev) => prev.filter((x) => x._id !== e._id));
        },
      },
    ]);
  }

  const cats = form.type === "office" ? OFFICE_CATS : OTHER_CATS;

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.expenses.title} subtitle={t.expenses.subtitle} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
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
                <StatCard label={t.expenses.statApproved} value={fmt(totalApproved)} tone={colors.negative} />
                <StatCard label={t.expenses.statPending} value={fmt(totalPending)} tone={colors.warn} />
              </View>
              <View style={styles.filterRow}>
                {(["", "office", "other"] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setTypeFilter(f)}
                    style={[styles.filterChip, typeFilter === f && styles.filterChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, typeFilter === f && styles.filterChipTextActive]}>
                      {f === "" ? t.common.all : f === "office" ? t.expenses.typeOffice : t.expenses.typeOther}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <ShinyButton onPress={openCreate} style={styles.addButton}>
                + {t.expenses.addButton}
              </ShinyButton>
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t.expenses.empty}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, shadow.card]} activeOpacity={0.75} onPress={() => openEdit(item)} onLongPress={() => confirmDelete(item)}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.description}</Text>
                  <Text style={styles.cardMeta}>{item.category} · {formatDate(item.date)}</Text>
                </View>
                <Text style={[styles.badge, { color: STATUS_TONE[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
              </View>
              <Text style={styles.cardAmount}>{fmt(item.amount)}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <FormModal
        visible={open}
        onClose={() => setOpen(false)}
        title={editing ? t.expenses.editTitle : t.expenses.addTitle}
        footer={
          <>
            <TouchableOpacity style={styles.footerBtnOutline} onPress={() => setOpen(false)} activeOpacity={0.7}>
              <Text style={styles.footerBtnOutlineText}>{t.common.cancel}</Text>
            </TouchableOpacity>
            <ShinyButton onPress={handleSave} disabled={!form.description.trim() || saving} style={styles.footerBtn}>
              {saving ? t.common.saving : t.common.save}
            </ShinyButton>
          </>
        }
      >
        <Field label={t.expenses.fieldType}>
          <ChipGroup
            options={["office", "other"] as const}
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v, category: v === "office" ? OFFICE_CATS[0] : OTHER_CATS[0] }))}
            labels={{ office: t.expenses.typeOffice, other: t.expenses.typeOther }}
          />
        </Field>
        <Field label={t.expenses.fieldCategory}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ChipGroup options={cats} value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} />
          </ScrollView>
        </Field>
        <Field label={t.expenses.fieldDescription}>
          <TextField value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} />
        </Field>
        <Field label={t.expenses.fieldUnitPrice}>
          <MoneyField value={form.unitPrice} onChangeValue={(v) => setUnitPriceAndQty(v, form.quantity)} />
        </Field>
        <Field label={t.expenses.fieldQuantity}>
          <TextField
            value={String(form.quantity)}
            onChangeText={(v) => setUnitPriceAndQty(form.unitPrice, Math.max(1, Number(v.replace(/[^0-9]/g, "")) || 1))}
            keyboardType="numeric"
          />
        </Field>
        <Field label={t.expenses.fieldTotal}>
          <Text style={styles.readonlyValue}>{fmt(form.unitPrice * form.quantity)}</Text>
        </Field>
        <Field label={t.expenses.fieldDate}>
          <TextField value={form.date} onChangeText={(v) => setForm((f) => ({ ...f, date: v }))} placeholder="YYYY-MM-DD" />
        </Field>
        <Field label={t.expenses.fieldStatus}>
          <ChipGroup
            options={["pending", "approved", "rejected"] as const}
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            labels={STATUS_LABEL}
          />
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
  cardAmount: { fontSize: 16, fontWeight: "700", color: colors.negative, marginTop: 10 },
  badge: { fontSize: 11, fontWeight: "700" },
  footerBtn: { flex: 1 },
  footerBtnOutline: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  footerBtnOutlineText: { color: colors.text, fontWeight: "600", fontSize: 14 },
  readonlyValue: { fontSize: 14, color: colors.muted, textAlign: "right", paddingVertical: 10 },
});

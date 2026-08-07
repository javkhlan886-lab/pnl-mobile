import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
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
  getReceivables,
  createReceivable,
  updateReceivable,
  deleteReceivable,
  type Receivable,
  type ReceivableInput,
} from "@/lib/receivables";

function emptyForm(): ReceivableInput {
  return {
    type: "receivable",
    counterparty: "",
    unitPrice: 0,
    quantity: 1,
    amount: 0,
    dueDate: "",
    interestRate: 0,
    status: "current",
    note: "",
  };
}

export default function ReceivablesScreen() {
  const { t } = useLocale();
  const [items, setItems] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"" | "receivable" | "loan">("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ReceivableInput>(emptyForm());
  const [saving, setSaving] = useState(false);

  const STATUS_LABEL: Record<Receivable["status"], string> = {
    current: t.receivables.statusCurrent,
    near: t.receivables.statusNear,
    overdue: t.receivables.statusOverdue,
    paid: t.receivables.statusPaid,
  };
  const STATUS_TONE: Record<Receivable["status"], string> = {
    current: colors.positive,
    near: colors.warn,
    overdue: colors.negative,
    paid: colors.muted,
  };

  const load = useCallback(async () => {
    try {
      setItems(await getReceivables());
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

  const filtered = typeFilter ? items.filter((i) => i.type === typeFilter) : items;
  const receivables = items.filter((i) => i.type === "receivable" && i.status !== "paid");
  const loans = items.filter((i) => i.type === "loan" && i.status !== "paid");
  const totalReceivable = receivables.reduce((s, i) => s + i.amount, 0);
  const totalLoan = loans.reduce((s, i) => s + i.amount, 0);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(i: Receivable) {
    setEditing(i._id);
    setForm({ ...i, dueDate: formatDate(i.dueDate) });
    setOpen(true);
  }
  function setUnitPriceAndQty(unitPrice: number, quantity: number) {
    setForm((f) => ({ ...f, unitPrice, quantity, amount: unitPrice * quantity }));
  }

  async function handleSave() {
    if (!form.counterparty.trim() || form.unitPrice * form.quantity === 0) return;
    setSaving(true);
    try {
      const payload = { ...form, amount: form.unitPrice * form.quantity };
      if (editing) {
        const updated = await updateReceivable(editing, payload);
        setItems((prev) => prev.map((i) => (i._id === editing ? updated : i)));
      } else {
        const created = await createReceivable(payload);
        setItems((prev) => [created, ...prev]);
      }
      setOpen(false);
    } catch {
      Alert.alert(t.common.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(i: Receivable) {
    Alert.alert(t.common.deleteConfirmTitle, format(t.receivables.deleteConfirm, { name: i.counterparty }), [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: async () => {
          await deleteReceivable(i._id);
          setItems((prev) => prev.filter((x) => x._id !== i._id));
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.receivables.title} subtitle={t.receivables.subtitle} />
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
                <StatCard label={t.receivables.statReceivable} value={fmt(totalReceivable)} tone={colors.positive} sub={format(t.receivables.statReceivableSub, { count: String(receivables.length) })} />
                <StatCard label={t.receivables.statLoan} value={fmt(totalLoan)} tone={colors.negative} sub={format(t.receivables.statLoanSub, { count: String(loans.length) })} />
                <StatCard label={t.receivables.statNetPosition} value={fmt(totalReceivable - totalLoan)} tone={totalReceivable - totalLoan >= 0 ? colors.positive : colors.negative} />
              </View>
              <View style={styles.filterRow}>
                {(["", "receivable", "loan"] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setTypeFilter(f)}
                    style={[styles.filterChip, typeFilter === f && styles.filterChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, typeFilter === f && styles.filterChipTextActive]}>
                      {f === "" ? t.common.all : f === "receivable" ? t.receivables.typeReceivable : t.receivables.typeLoan}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <ShinyButton onPress={openCreate} style={styles.addButton}>
                + {t.receivables.addButton}
              </ShinyButton>
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t.receivables.empty}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, shadow.card]} activeOpacity={0.75} onPress={() => openEdit(item)} onLongPress={() => confirmDelete(item)}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.counterparty}</Text>
                  <Text style={styles.cardMeta}>{item.dueDate ? format(t.receivables.dueDateLabel, { date: formatDate(item.dueDate) }) : t.receivables.noDueDate}</Text>
                </View>
                <Text style={[styles.badge, { color: STATUS_TONE[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
              </View>
              <Text style={[styles.cardAmount, { color: item.type === "receivable" ? colors.positive : colors.negative }]}>
                {fmt(item.amount)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <FormModal
        visible={open}
        onClose={() => setOpen(false)}
        title={editing ? t.receivables.editTitle : t.receivables.addTitle}
        footer={
          <>
            <TouchableOpacity style={styles.footerBtnOutline} onPress={() => setOpen(false)} activeOpacity={0.7}>
              <Text style={styles.footerBtnOutlineText}>{t.common.cancel}</Text>
            </TouchableOpacity>
            <ShinyButton onPress={handleSave} disabled={!form.counterparty.trim() || saving} style={styles.footerBtn}>
              {saving ? t.common.saving : t.common.save}
            </ShinyButton>
          </>
        }
      >
        <Field label={t.receivables.fieldType}>
          <ChipGroup
            options={["receivable", "loan"] as const}
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v }))}
            labels={{ receivable: t.receivables.typeReceivable, loan: t.receivables.typeLoan }}
          />
        </Field>
        <Field label={form.type === "receivable" ? t.receivables.fieldCounterpartyReceivable : t.receivables.fieldCounterpartyLoan}>
          <TextField value={form.counterparty} onChangeText={(v) => setForm((f) => ({ ...f, counterparty: v }))} />
        </Field>
        <Field label={t.receivables.fieldUnitPrice}>
          <MoneyField value={form.unitPrice} onChangeValue={(v) => setUnitPriceAndQty(v, form.quantity)} />
        </Field>
        <Field label={t.receivables.fieldQuantity}>
          <TextField
            value={String(form.quantity)}
            onChangeText={(v) => setUnitPriceAndQty(form.unitPrice, Math.max(1, Number(v.replace(/[^0-9]/g, "")) || 1))}
            keyboardType="numeric"
          />
        </Field>
        <Field label={t.receivables.fieldTotal}>
          <Text style={styles.readonlyValue}>{fmt(form.unitPrice * form.quantity)}</Text>
        </Field>
        <Field label={t.receivables.fieldInterest}>
          <TextField
            value={String(form.interestRate ?? 0)}
            onChangeText={(v) => setForm((f) => ({ ...f, interestRate: Number(v.replace(/[^0-9.]/g, "")) || 0 }))}
            keyboardType="numeric"
          />
        </Field>
        <Field label={t.receivables.fieldDueDate}>
          <TextField value={form.dueDate} onChangeText={(v) => setForm((f) => ({ ...f, dueDate: v }))} placeholder="YYYY-MM-DD" />
        </Field>
        <Field label={t.receivables.fieldStatus}>
          <ChipGroup
            options={["current", "near", "overdue", "paid"] as const}
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
  cardAmount: { fontSize: 16, fontWeight: "700", marginTop: 10 },
  badge: { fontSize: 11, fontWeight: "700" },
  footerBtn: { flex: 1 },
  footerBtnOutline: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  footerBtnOutlineText: { color: colors.text, fontWeight: "600", fontSize: 14 },
  readonlyValue: { fontSize: 14, color: colors.muted, textAlign: "right", paddingVertical: 10 },
});

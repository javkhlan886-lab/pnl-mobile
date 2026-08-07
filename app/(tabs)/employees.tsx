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
import { fmt } from "@/lib/format";
import { useLocale, format } from "@/lib/i18n";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type Employee,
  type EmployeeInput,
} from "@/lib/employees";

export default function EmployeesScreen() {
  const { t } = useLocale();
  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeInput>(emptyForm());
  const [saving, setSaving] = useState(false);

  const STATUS_LABEL: Record<Employee["status"], string> = {
    active: t.employees.statusActive,
    leave: t.employees.statusLeave,
    inactive: t.employees.statusInactive,
  };
  const STATUS_TONE: Record<Employee["status"], string> = {
    active: colors.positive,
    leave: colors.warn,
    inactive: colors.muted,
  };

  const load = useCallback(async () => {
    try {
      setItems(await getEmployees());
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

  const active = items.filter((e) => e.status === "active");
  const totalSalary = active.reduce((s, e) => s + e.baseSalary, 0);
  const totalND = active.reduce((s, e) => s + (e.baseSalary * e.ndRate) / 100, 0);
  const engineerCount = items.filter((e) => e.type === "engineer").length;
  const staffCount = items.filter((e) => e.type === "staff").length;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(e: Employee) {
    setEditing(e._id);
    setForm(e);
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateEmployee(editing, form);
        setItems((prev) => prev.map((e) => (e._id === editing ? updated : e)));
      } else {
        const created = await createEmployee(form);
        setItems((prev) => [created, ...prev]);
      }
      setOpen(false);
    } catch {
      Alert.alert(t.common.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(e: Employee) {
    Alert.alert(t.common.deleteConfirmTitle, format(t.employees.deleteConfirm, { name: e.name }), [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: async () => {
          await deleteEmployee(e._id);
          setItems((prev) => prev.filter((x) => x._id !== e._id));
        },
      },
    ]);
  }

  const nd = (form.baseSalary * form.ndRate) / 100;
  const ndsht = (form.baseSalary * form.ndshtRate) / 100;

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.employees.title} subtitle={t.employees.subtitle} />
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
                <StatCard label={t.employees.statTotal} value={String(items.length)} sub={format(t.employees.statTotalSub, { engineers: String(engineerCount), staff: String(staffCount) })} />
                <StatCard label={t.employees.statSalary} value={fmt(totalSalary)} tone={colors.negative} />
                <StatCard label={t.employees.statNd} value={fmt(totalND)} tone={colors.negative} />
                <StatCard label={t.employees.statTotalCost} value={fmt(totalSalary + totalND)} tone={colors.negative} />
              </View>
              <ShinyButton onPress={openCreate} style={styles.addButton}>
                + {t.employees.addButton}
              </ShinyButton>
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t.employees.empty}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const total = item.baseSalary + (item.baseSalary * item.ndRate) / 100 + (item.baseSalary * item.ndshtRate) / 100;
            return (
              <TouchableOpacity style={[styles.card, shadow.card]} activeOpacity={0.75} onPress={() => openEdit(item)} onLongPress={() => confirmDelete(item)}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardMeta}>{item.position || "—"} · {item.type === "engineer" ? t.employees.typeEngineer : t.employees.typeStaff}</Text>
                  </View>
                  <Text style={[styles.badge, { color: STATUS_TONE[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
                </View>
                <Text style={styles.cardAmount}>{fmt(total)}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <FormModal
        visible={open}
        onClose={() => setOpen(false)}
        title={editing ? t.employees.editTitle : t.employees.addTitle}
        footer={
          <>
            <TouchableOpacity style={styles.footerBtnOutline} onPress={() => setOpen(false)} activeOpacity={0.7}>
              <Text style={styles.footerBtnOutlineText}>{t.common.cancel}</Text>
            </TouchableOpacity>
            <ShinyButton onPress={handleSave} disabled={!form.name.trim() || saving} style={styles.footerBtn}>
              {saving ? t.common.saving : t.common.save}
            </ShinyButton>
          </>
        }
      >
        <Field label={t.employees.fieldName}>
          <TextField value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
        </Field>
        <Field label={t.employees.fieldPosition}>
          <TextField value={form.position} onChangeText={(v) => setForm((f) => ({ ...f, position: v }))} />
        </Field>
        <Field label={t.employees.fieldType}>
          <ChipGroup
            options={["staff", "engineer"] as const}
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v }))}
            labels={{ staff: t.employees.typeStaff, engineer: t.employees.typeEngineer }}
          />
        </Field>
        <Field label={t.employees.fieldStatus}>
          <ChipGroup
            options={["active", "leave", "inactive"] as const}
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            labels={STATUS_LABEL}
          />
        </Field>
        <Field label={t.employees.fieldBaseSalary}>
          <MoneyField value={form.baseSalary} onChangeValue={(v) => setForm((f) => ({ ...f, baseSalary: v }))} />
        </Field>
        <Field label={t.employees.fieldNdRate}>
          <TextField
            value={String(form.ndRate)}
            onChangeText={(v) => setForm((f) => ({ ...f, ndRate: Number(v.replace(/[^0-9]/g, "")) || 0 }))}
            keyboardType="numeric"
          />
        </Field>
        <Field label={t.employees.fieldNdshtRate}>
          <TextField
            value={String(form.ndshtRate)}
            onChangeText={(v) => setForm((f) => ({ ...f, ndshtRate: Number(v.replace(/[^0-9]/g, "")) || 0 }))}
            keyboardType="numeric"
          />
        </Field>
        {form.baseSalary > 0 && (
          <View style={styles.summaryBox}>
            <SummaryRow label={t.employees.summaryBaseSalary} value={fmt(form.baseSalary)} />
            <SummaryRow label={format(t.employees.summaryNd, { rate: String(form.ndRate) })} value={fmt(nd)} tone={colors.negative} />
            <SummaryRow label={format(t.employees.summaryNdsht, { rate: String(form.ndshtRate) })} value={fmt(ndsht)} tone={colors.negative} />
            <SummaryRow label={t.employees.summaryTotal} value={fmt(form.baseSalary + nd + ndsht)} tone={colors.negative} bold />
          </View>
        )}
      </FormModal>
    </View>
  );
}

function emptyForm(): EmployeeInput {
  return {
    name: "",
    position: "",
    type: "staff",
    baseSalary: 0,
    ndRate: 10,
    ndshtRate: 2,
    status: "active",
    startDate: new Date().toISOString().split("T")[0],
  };
}

function SummaryRow({ label, value, tone, bold }: { label: string; value: string; tone?: string; bold?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, tone ? { color: tone } : null, bold && { fontWeight: "700" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  listContent: { padding: 16, paddingBottom: 32 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
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
  summaryBox: { backgroundColor: colors.bg, borderRadius: 10, padding: 12, gap: 6, borderWidth: 1, borderColor: colors.border },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 12, color: colors.muted },
  summaryValue: { fontSize: 13, color: colors.text, fontWeight: "600" },
});

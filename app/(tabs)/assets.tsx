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
import { fmt } from "@/lib/format";
import { useLocale, format } from "@/lib/i18n";
import {
  getAssets,
  createAsset,
  updateAsset,
  disposeAsset,
  calcDepreciation,
  ASSET_CATEGORIES,
  type Asset,
  type AssetInput,
} from "@/lib/assets";

function emptyForm(): AssetInput {
  return {
    name: "",
    code: "",
    category: ASSET_CATEGORIES[0],
    unitPrice: 0,
    quantity: 1,
    price: 0,
    residualValue: 0,
    lifespan: 5,
    depMethod: "straight",
    purchaseDate: new Date().toISOString().split("T")[0],
    assignedTo: "",
    location: "",
    currency: "₮",
  };
}

export default function AssetsScreen() {
  const { t } = useLocale();
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<AssetInput>(emptyForm());
  const [saving, setSaving] = useState(false);

  const STATUS_LABEL: Record<Asset["status"], string> = {
    active: t.assets.statusActive,
    disposed: t.assets.statusDisposed,
    maintenance: t.assets.statusMaintenance,
  };
  const STATUS_TONE: Record<Asset["status"], string> = {
    active: colors.positive,
    disposed: colors.muted,
    maintenance: colors.warn,
  };

  const load = useCallback(async () => {
    try {
      setItems(await getAssets());
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

  const active = items.filter((a) => a.status === "active");
  const totalValue = active.reduce((s, a) => s + a.price, 0);
  const totalCurrent = active.reduce((s, a) => {
    if (!a.purchaseDate) return s + a.price;
    return s + calcDepreciation(a.price, a.residualValue, a.lifespan, a.depMethod, a.purchaseDate).currentValue;
  }, 0);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(a: Asset) {
    setEditing(a._id);
    setForm(a);
    setOpen(true);
  }

  function setUnitPriceAndQty(unitPrice: number, quantity: number) {
    setForm((f) => ({ ...f, unitPrice, quantity, price: unitPrice * quantity }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, price: form.unitPrice * form.quantity };
      if (editing) {
        const updated = await updateAsset(editing, payload);
        setItems((prev) => prev.map((a) => (a._id === editing ? updated : a)));
      } else {
        const code = "AST-" + form.category.slice(0, 2).toUpperCase() + "-" + Math.floor(Math.random() * 9000 + 1000);
        const created = await createAsset({ ...payload, code });
        setItems((prev) => [created, ...prev]);
      }
      setOpen(false);
    } catch {
      Alert.alert(t.common.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  function confirmDispose(a: Asset) {
    Alert.alert(t.common.deleteConfirmTitle, format(t.assets.deleteConfirm, { name: a.name }), [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: async () => {
          await disposeAsset(a._id);
          setItems((prev) => prev.map((x) => (x._id === a._id ? { ...x, status: "disposed" } : x)));
        },
      },
    ]);
  }

  const dep = form.price > 0 && form.purchaseDate
    ? calcDepreciation(form.price, form.residualValue, form.lifespan, form.depMethod, form.purchaseDate)
    : null;

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.assets.title} subtitle={t.assets.subtitle} />
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
                <StatCard label={t.assets.statTotal} value={String(items.length)} sub={format(t.assets.statTotalSub, { count: String(active.length) })} />
                <StatCard label={t.assets.statInitial} value={fmt(totalValue)} tone={colors.info} />
                <StatCard label={t.assets.statCurrent} value={fmt(totalCurrent)} tone={colors.positive} />
              </View>
              <ShinyButton onPress={openCreate} style={styles.addButton}>
                + {t.assets.addButton}
              </ShinyButton>
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t.assets.empty}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const d = item.purchaseDate
              ? calcDepreciation(item.price, item.residualValue, item.lifespan, item.depMethod, item.purchaseDate)
              : null;
            return (
              <TouchableOpacity style={[styles.card, shadow.card]} activeOpacity={0.75} onPress={() => openEdit(item)} onLongPress={() => confirmDispose(item)}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardMeta}>{item.category} · {item.code}</Text>
                  </View>
                  <Text style={[styles.badge, { color: STATUS_TONE[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardAmount}>{fmt(item.price)}</Text>
                  {d && <Text style={styles.cardSub}>{t.assets.summaryCurrent}: {fmt(d.currentValue)}</Text>}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <FormModal
        visible={open}
        onClose={() => setOpen(false)}
        title={editing ? t.assets.editTitle : t.assets.addTitle}
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
        <Field label={t.assets.fieldName}>
          <TextField value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
        </Field>
        <Field label={t.assets.fieldCategory}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ChipGroup options={ASSET_CATEGORIES} value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} />
          </ScrollView>
        </Field>
        <Field label={t.assets.fieldUnitPrice}>
          <MoneyField value={form.unitPrice} onChangeValue={(v) => setUnitPriceAndQty(v, form.quantity)} />
        </Field>
        <Field label={t.assets.fieldQuantity}>
          <TextField
            value={String(form.quantity)}
            onChangeText={(v) => setUnitPriceAndQty(form.unitPrice, Math.max(1, Number(v.replace(/[^0-9]/g, "")) || 1))}
            keyboardType="numeric"
          />
        </Field>
        <Field label={t.assets.fieldTotalPrice}>
          <Text style={styles.readonlyValue}>{fmt(form.unitPrice * form.quantity)}</Text>
        </Field>
        <Field label={t.assets.fieldResidual}>
          <MoneyField value={form.residualValue} onChangeValue={(v) => setForm((f) => ({ ...f, residualValue: v }))} />
        </Field>
        <Field label={t.assets.fieldLifespan}>
          <TextField
            value={String(form.lifespan)}
            onChangeText={(v) => setForm((f) => ({ ...f, lifespan: Math.max(1, Number(v.replace(/[^0-9]/g, "")) || 1) }))}
            keyboardType="numeric"
          />
        </Field>
        <Field label={t.assets.fieldDepMethod}>
          <ChipGroup
            options={["straight", "declining"] as const}
            value={form.depMethod}
            onChange={(v) => setForm((f) => ({ ...f, depMethod: v }))}
            labels={{ straight: t.assets.methodStraight, declining: t.assets.methodDeclining }}
          />
        </Field>
        <Field label={t.assets.fieldAssignee}>
          <TextField value={form.assignedTo} onChangeText={(v) => setForm((f) => ({ ...f, assignedTo: v }))} />
        </Field>
        <Field label={t.assets.fieldLocation}>
          <TextField value={form.location} onChangeText={(v) => setForm((f) => ({ ...f, location: v }))} />
        </Field>
        {dep && (
          <View style={styles.summaryBox}>
            <SummaryRow label={t.assets.summaryMonthly} value={fmt(dep.monthly)} tone={colors.negative} />
            <SummaryRow label={t.assets.summaryYearly} value={fmt(dep.yearly)} tone={colors.negative} />
            <SummaryRow label={t.assets.summaryCurrent} value={fmt(dep.currentValue)} tone={colors.positive} bold />
            <SummaryRow label={t.assets.summaryDepPct} value={`${dep.depreciatedPct}%`} />
          </View>
        )}
      </FormModal>
    </View>
  );
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
  cardRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginTop: 4 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  cardMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  cardAmount: { fontSize: 15, fontWeight: "700", color: colors.text },
  cardSub: { fontSize: 12, color: colors.positive },
  badge: { fontSize: 11, fontWeight: "700" },
  footerBtn: { flex: 1 },
  footerBtnOutline: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  footerBtnOutlineText: { color: colors.text, fontWeight: "600", fontSize: 14 },
  readonlyValue: { fontSize: 14, color: colors.muted, textAlign: "right", paddingVertical: 10 },
  summaryBox: { backgroundColor: colors.bg, borderRadius: 10, padding: 12, gap: 6, borderWidth: 1, borderColor: colors.border },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 12, color: colors.muted },
  summaryValue: { fontSize: 13, color: colors.text, fontWeight: "600" },
});

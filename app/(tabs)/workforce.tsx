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
  getWorkforce,
  createWorkforce,
  updateWorkforce,
  deleteWorkforce,
  type Workforce,
  type WorkforceInput,
} from "@/lib/workforce";

export default function WorkforceScreen() {
  const { t } = useLocale();
  const [items, setItems] = useState<Workforce[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<WorkforceInput>(emptyForm());
  const [saving, setSaving] = useState(false);

  const STATUS_LABEL: Record<Workforce["status"], string> = {
    active: t.workforce.statusActive,
    inactive: t.workforce.statusInactive,
  };
  const STATUS_TONE: Record<Workforce["status"], string> = {
    active: colors.positive,
    inactive: colors.muted,
  };

  const load = useCallback(async () => {
    try {
      setItems(await getWorkforce());
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

  const activeCount = items.filter((e) => e.status === "active").length;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(e: Workforce) {
    setEditing(e._id);
    setForm(e);
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateWorkforce(editing, form);
        setItems((prev) => prev.map((e) => (e._id === editing ? updated : e)));
      } else {
        const created = await createWorkforce(form);
        setItems((prev) => [created, ...prev]);
      }
      setOpen(false);
    } catch {
      Alert.alert(t.common.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(e: Workforce) {
    Alert.alert(t.common.deleteConfirmTitle, format(t.workforce.deleteConfirm, { name: e.name }), [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: async () => {
          await deleteWorkforce(e._id);
          setItems((prev) => prev.filter((x) => x._id !== e._id));
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.workforce.title} subtitle={t.workforce.subtitle} />
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
                <StatCard label={t.workforce.statTotal} value={String(items.length)} />
                <StatCard label={t.workforce.statActive} value={String(activeCount)} tone={colors.positive} />
              </View>
              <ShinyButton onPress={openCreate} style={styles.addButton}>
                + {t.workforce.addButton}
              </ShinyButton>
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t.workforce.empty}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, shadow.card]} activeOpacity={0.75} onPress={() => openEdit(item)} onLongPress={() => confirmDelete(item)}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardMeta}>{item.phone || "—"} · {item.skills || "—"}</Text>
                </View>
                <Text style={[styles.badge, { color: STATUS_TONE[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
              </View>
              <Text style={styles.cardAmount}>{fmt(item.rate)}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <FormModal
        visible={open}
        onClose={() => setOpen(false)}
        title={editing ? t.workforce.editTitle : t.workforce.addTitle}
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
        <Field label={t.workforce.fieldName}>
          <TextField value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
        </Field>
        <Field label={t.workforce.fieldAddress}>
          <TextField value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} />
        </Field>
        <Field label={t.workforce.fieldPhone}>
          <TextField value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" />
        </Field>
        <Field label={t.workforce.fieldEmail}>
          <TextField value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" />
        </Field>
        <Field label={t.workforce.fieldSkills}>
          <TextField value={form.skills} onChangeText={(v) => setForm((f) => ({ ...f, skills: v }))} multiline />
        </Field>
        <Field label={t.workforce.fieldRate}>
          <MoneyField value={form.rate} onChangeValue={(v) => setForm((f) => ({ ...f, rate: v }))} />
        </Field>
        <Field label={t.workforce.fieldStatus}>
          <ChipGroup
            options={["active", "inactive"] as const}
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            labels={STATUS_LABEL}
          />
        </Field>
        <Field label={t.workforce.fieldNote}>
          <TextField value={form.note} onChangeText={(v) => setForm((f) => ({ ...f, note: v }))} multiline />
        </Field>
      </FormModal>
    </View>
  );
}

function emptyForm(): WorkforceInput {
  return {
    name: "",
    address: "",
    phone: "",
    email: "",
    skills: "",
    rate: 0,
    status: "active",
    note: "",
  };
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
  cardAmount: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 10 },
  badge: { fontSize: 11, fontWeight: "700" },
  footerBtn: { flex: 1 },
  footerBtnOutline: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  footerBtnOutlineText: { color: colors.text, fontWeight: "600", fontSize: 14 },
});

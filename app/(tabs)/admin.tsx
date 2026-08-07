import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FormModal, ChipGroup } from "@/components/FormModal";
import { ShinyButton } from "@/components/ShinyButton";
import { useAuth } from "@/hooks/useAuth";
import { useLocale, format } from "@/lib/i18n";
import { colors, shadow } from "@/lib/theme";
import { getCompanyUsers, changePnlLevel } from "@/lib/admin";
import type { AuthUser } from "@/lib/auth";

type LevelStr = "1" | "2" | "3" | "4";

export default function AdminScreen() {
  const { t } = useLocale();
  const { isAdmin, company } = useAuth();
  const [users, setUsers] = useState<AuthUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<AuthUser | null>(null);
  const [assignPicked, setAssignPicked] = useState<Set<string>>(new Set());

  const LEVEL_LABEL: Record<LevelStr, string> = {
    "1": t.admin.level1,
    "2": t.admin.level2,
    "3": t.admin.level3,
    "4": t.admin.level4,
  };

  useEffect(() => {
    if (!company) return;
    getCompanyUsers(company.id)
      .then(setUsers)
      .catch(() => setError(t.admin.loadError));
  }, [company, t]);

  const regularUsers = (users ?? []).filter((u) => u.role === "company_user");

  async function applyLevel(target: AuthUser, level: 1 | 2 | 3 | 4, viewableUserIds?: string[]) {
    setSavingId(target.id);
    try {
      const updated = await changePnlLevel(target.id, level, viewableUserIds);
      setUsers((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)) ?? prev);
    } catch {
      setError(t.admin.saveError);
    } finally {
      setSavingId(null);
    }
  }

  function handleLevelChange(target: AuthUser, value: LevelStr) {
    const level = Number(value) as 1 | 2 | 3 | 4;
    if (level === 3) {
      setAssignPicked(new Set(target.pnlViewableUserIds ?? []));
      setAssignFor(target);
      return;
    }
    applyLevel(target, level);
  }

  function confirmAssign() {
    if (!assignFor) return;
    applyLevel(assignFor, 3, Array.from(assignPicked));
    setAssignFor(null);
  }

  const otherUsers = (target: AuthUser) =>
    regularUsers.filter((u) => u.id !== target.id);

  if (!isAdmin) {
    return (
      <View style={styles.screen}>
        <ScreenHeader title={t.admin.title} subtitle={t.admin.subtitle} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t.admin.noAccess}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t.admin.title} subtitle={t.admin.subtitle} />
      {users === null ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={regularUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <Text style={styles.description}>{t.admin.description}</Text>
              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{t.admin.noUsers}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const level = String((item.pnlLevel ?? 4) as 1 | 2 | 3 | 4) as LevelStr;
            return (
              <View style={[styles.card, shadow.card]}>
                <Text style={styles.cardTitle}>{item.name || "—"}</Text>
                <Text style={styles.cardMeta}>{item.email}</Text>
                <View style={styles.chipWrap}>
                  <ChipGroup
                    options={["1", "2", "3", "4"] as const}
                    value={level}
                    onChange={(v) => handleLevelChange(item, v)}
                    labels={LEVEL_LABEL}
                  />
                </View>
                {level === "3" && (
                  <Text style={styles.viewableText}>
                    {item.pnlViewableUserIds?.length
                      ? format(t.admin.viewableCount, { count: String(item.pnlViewableUserIds.length) })
                      : t.admin.viewableNone}
                  </Text>
                )}
                {savingId === item.id && <ActivityIndicator size="small" color={colors.primary} style={styles.savingSpinner} />}
              </View>
            );
          }}
        />
      )}

      <FormModal
        visible={!!assignFor}
        onClose={() => setAssignFor(null)}
        title={t.admin.assignTitle}
        footer={
          <>
            <TouchableOpacity style={styles.footerBtnOutline} onPress={() => setAssignFor(null)} activeOpacity={0.7}>
              <Text style={styles.footerBtnOutlineText}>{t.common.cancel}</Text>
            </TouchableOpacity>
            <ShinyButton onPress={confirmAssign} style={styles.footerBtn}>
              {t.common.save}
            </ShinyButton>
          </>
        }
      >
        <Text style={styles.assignDesc}>
          {format(t.admin.assignDesc, { name: assignFor?.name || assignFor?.email || "" })}
        </Text>
        {assignFor &&
          otherUsers(assignFor).map((u) => {
            const picked = assignPicked.has(u.id);
            return (
              <TouchableOpacity
                key={u.id}
                style={styles.pickRow}
                activeOpacity={0.7}
                onPress={() =>
                  setAssignPicked((prev) => {
                    const next = new Set(prev);
                    if (next.has(u.id)) next.delete(u.id);
                    else next.add(u.id);
                    return next;
                  })
                }
              >
                <Ionicons
                  name={picked ? "checkmark-circle" : "ellipse-outline"}
                  size={20}
                  color={picked ? colors.positive : colors.muted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickName}>{u.name || u.email}</Text>
                  <Text style={styles.pickEmail}>{u.email}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        {assignFor && otherUsers(assignFor).length === 0 && (
          <Text style={styles.emptyText}>{t.admin.noOtherUsers}</Text>
        )}
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  listContent: { padding: 16, paddingBottom: 32 },
  description: { fontSize: 13, color: colors.muted, marginBottom: 14 },
  emptyText: { color: colors.muted, fontSize: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  cardMeta: { fontSize: 12, color: colors.muted, marginTop: 2, marginBottom: 10 },
  chipWrap: {},
  viewableText: { fontSize: 12, color: colors.muted, marginTop: 8 },
  savingSpinner: { position: "absolute", top: 14, right: 14 },
  footerBtn: { flex: 1 },
  footerBtnOutline: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  footerBtnOutlineText: { color: colors.text, fontWeight: "600", fontSize: 14 },
  pickRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  pickName: { fontSize: 14, color: colors.text, fontWeight: "600" },
  pickEmail: { fontSize: 12, color: colors.muted },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderColor: "rgba(239,68,68,0.35)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: "#fca5a5", fontSize: 13 },
  assignDesc: { fontSize: 12, color: colors.muted, marginBottom: 10 },
});

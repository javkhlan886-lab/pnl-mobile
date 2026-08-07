import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useLocale, format } from "@/lib/i18n";
import { colors, shadow } from "@/lib/theme";
import { fmt } from "@/lib/format";
import { ShinyButton } from "./ShinyButton";
import {
  getPaymentStatus,
  startCheckout,
  refreshCheckout,
  getQrAction,
  findActionUrl,
  daysLeft,
  type PaymentStatus,
  type QrAction,
} from "@/lib/payments";

const POLL_MS = 5000;
const WARN_THRESHOLD_DAYS = 5;

export function PaymentCard() {
  const { isAdmin } = useAuth();
  const { t } = useLocale();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [actionUrl, setActionUrl] = useState<string | null>(null);
  const [qrAction, setQrAction] = useState<QrAction | null>(null);
  const [pendingIntentId, setPendingIntentId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const s = await getPaymentStatus();
      setStatus(s);
      setError(null);
    } catch {
      setError(t.payments.statusError);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!pendingIntentId) return;
    pollRef.current = setInterval(async () => {
      const res = await refreshCheckout(pendingIntentId).catch(() => null);
      if (res?.isActive) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setPendingIntentId(null);
        setActionUrl(null);
        setQrAction(null);
        setConfirmed(true);
        loadStatus();
      }
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pendingIntentId, loadStatus]);

  async function handleCheckout() {
    setCheckingOut(true);
    setError(null);
    try {
      const res = await startCheckout();
      setPendingIntentId(res.paymentIntentId);
      setQrAction(getQrAction(res.nextAction));
      setActionUrl(findActionUrl(res.nextAction));
      if (res.status === "succeeded") {
        setConfirmed(true);
        loadStatus();
      }
    } catch {
      setError(t.payments.checkoutError);
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.card, shadow.card, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Payments not wired up on the backend yet — nothing to show.
  if (!status || !status.configured) return null;

  if (status.isActive) {
    const days = daysLeft(status.paidUntil);
    const soon = days <= WARN_THRESHOLD_DAYS;
    return (
      <View style={[styles.card, shadow.card, { borderColor: soon ? "rgba(251,191,36,0.4)" : colors.borderLight }]}>
        <Text style={styles.title}>{t.payments.title}</Text>
        <Text style={[styles.desc, soon && { color: colors.warn }]}>
          {format(soon ? t.payments.expiringSoonDesc : t.payments.activeDesc, { days: String(days) })}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, shadow.card, { borderColor: "rgba(248,113,113,0.35)" }]}>
      <Text style={styles.title}>{t.payments.inactiveTitle}</Text>
      <Text style={styles.desc}>{t.payments.inactiveDesc}</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {confirmed && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{t.payments.paymentSuccess}</Text>
        </View>
      )}

      {!pendingIntentId && (
        <>
          <Text style={styles.price}>{format(t.payments.pricePerPeriod, { price: status.priceMnt.toLocaleString("en-US") })}</Text>
          {isAdmin ? (
            <ShinyButton onPress={handleCheckout} disabled={checkingOut} style={styles.payButton}>
              {checkingOut ? <ActivityIndicator color={colors.bg} /> : t.payments.payButton}
            </ShinyButton>
          ) : (
            <Text style={styles.adminOnly}>{t.payments.adminOnlyNotice}</Text>
          )}
        </>
      )}

      {pendingIntentId && (
        <View style={styles.pendingBox}>
          <View style={styles.waitingRow}>
            <ActivityIndicator size="small" color={colors.warn} />
            <Text style={styles.waitingText}>{t.payments.waitingPayment}</Text>
          </View>

          {qrAction && (
            <View style={styles.qrWrap}>
              <Image source={{ uri: qrAction.imageUrl }} style={styles.qrImage} />
              <Text style={styles.qrHint}>{t.payments.scanQr}</Text>
              {qrAction.deeplinks.length > 0 && (
                <View style={styles.deeplinkRow}>
                  {qrAction.deeplinks.map((dl) => (
                    <TouchableOpacity
                      key={dl.name}
                      style={styles.deeplinkItem}
                      onPress={() => Linking.openURL(dl.link).catch(() => {})}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri: dl.logo }} style={styles.deeplinkLogo} />
                      <Text style={styles.deeplinkText} numberOfLines={1}>
                        {dl.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {!qrAction && actionUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(actionUrl).catch(() => {})} activeOpacity={0.7}>
              <Text style={styles.linkText}>{t.payments.goToPaymentPage}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  center: { alignItems: "center", justifyContent: "center", minHeight: 60 },
  title: { fontSize: 15, fontWeight: "700", color: colors.text },
  desc: { fontSize: 13, color: colors.muted, marginTop: 4 },
  price: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 12 },
  payButton: { marginTop: 12 },
  adminOnly: { fontSize: 12, color: colors.muted, marginTop: 12, fontStyle: "italic" },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderColor: "rgba(239,68,68,0.35)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  errorText: { color: "#fca5a5", fontSize: 13 },
  successBox: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderColor: "rgba(34,197,94,0.35)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  successText: { color: colors.positive, fontSize: 13, fontWeight: "600" },
  pendingBox: { marginTop: 14 },
  waitingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  waitingText: { fontSize: 13, color: colors.muted },
  qrWrap: { alignItems: "center", marginTop: 14, gap: 10 },
  qrImage: { width: 180, height: 180, borderRadius: 10, backgroundColor: "#fff" },
  qrHint: { fontSize: 12, color: colors.muted, textAlign: "center" },
  deeplinkRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 6 },
  deeplinkItem: { alignItems: "center", width: 64, gap: 4 },
  deeplinkLogo: { width: 32, height: 32, borderRadius: 8 },
  deeplinkText: { fontSize: 10, color: colors.muted, textAlign: "center" },
  linkText: { color: colors.info, fontSize: 13, fontWeight: "600", marginTop: 10, textDecorationLine: "underline" },
});

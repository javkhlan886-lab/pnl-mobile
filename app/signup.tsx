import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError } from "@/lib/api";
import { signup, type SignupResponse } from "@/lib/auth";
import { useLocale, format } from "@/lib/i18n";
import { colors, shadow } from "@/lib/theme";
import { TextField } from "@/components/Inputs";
import { ShinyButton } from "@/components/ShinyButton";
import { ChipGroup, Field } from "@/components/FormModal";

type AccountType = "individual" | "organization";

export default function SignupScreen() {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const [accountType, setAccountType] = useState<AccountType>("organization");
  const [companyName, setCompanyName] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [adminName, setAdminName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SignupResponse | null>(null);

  const canSubmit =
    companyName.trim() &&
    (accountType === "individual" || registerNumber.trim()) &&
    adminName.trim() &&
    phone.trim() &&
    email.trim();

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await signup({
        accountType,
        companyName: companyName.trim(),
        registerNumber: accountType === "organization" ? registerNumber.trim() : undefined,
        adminName: adminName.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.signup.errorFallback);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <View style={styles.screen}>
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.title}>{t.signup.checkEmailTitle}</Text>
          <Text style={styles.subtitle}>{format(t.signup.checkEmailDesc, { email })}</Text>

          {result.dev && (
            <View style={styles.devBox}>
              <Text style={styles.devTitle}>{t.signup.devPreviewTitle}</Text>
              <Text style={styles.devText}>{format(t.signup.devPreviewOtp, { otp: result.dev.otp })}</Text>
            </View>
          )}

          <ShinyButton onPress={() => router.replace("/login")} style={styles.button}>
            {t.signup.backToLogin}
          </ShinyButton>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.title}>{t.signup.title}</Text>
          <Text style={styles.subtitle}>{t.signup.subtitle}</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Field label={t.signup.accountTypeLabel}>
            <ChipGroup
              options={["individual", "organization"] as const}
              value={accountType}
              onChange={setAccountType}
              labels={{ individual: t.signup.accountTypeIndividual, organization: t.signup.accountTypeOrganization }}
            />
          </Field>

          <Text style={styles.label}>{t.signup.companyName}</Text>
          <TextField value={companyName} onChangeText={setCompanyName} placeholder={t.signup.companyNamePlaceholder} style={styles.input} />

          {accountType === "organization" && (
            <>
              <Text style={styles.label}>{t.signup.registerNumber}</Text>
              <TextField value={registerNumber} onChangeText={setRegisterNumber} placeholder={t.signup.registerNumberPlaceholder} style={styles.input} />
            </>
          )}

          <Text style={styles.label}>{t.signup.yourName}</Text>
          <TextField value={adminName} onChangeText={setAdminName} style={styles.input} />

          <Text style={styles.label}>{t.signup.phone}</Text>
          <TextField value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />

          <Text style={styles.label}>{t.signup.email}</Text>
          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder="name@company.mn"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
          />

          <ShinyButton onPress={handleSubmit} disabled={!canSubmit || loading} style={styles.button}>
            {loading ? <ActivityIndicator color={colors.bg} /> : t.signup.submit}
          </ShinyButton>

          <TouchableOpacity onPress={() => router.replace("/login")} style={styles.backLink}>
            <Text style={styles.backLinkText}>{t.signup.backToLogin}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: 13, color: colors.muted, textAlign: "center", marginTop: 6, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6, marginTop: 12 },
  input: {},
  button: { marginTop: 24 },
  backLink: { marginTop: 16, alignItems: "center" },
  backLinkText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderColor: "rgba(239,68,68,0.35)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: "#fca5a5", fontSize: 13 },
  devBox: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 16,
  },
  devTitle: { fontSize: 11, fontWeight: "700", color: colors.warn, marginBottom: 4 },
  devText: { fontSize: 13, color: colors.text, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
});

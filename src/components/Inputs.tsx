import { TextInput, StyleSheet, type TextInputProps } from "react-native";
import { colors } from "@/lib/theme";

export function TextField(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      style={[styles.input, props.style]}
      {...props}
    />
  );
}

export function MoneyField({
  value,
  onChangeValue,
  placeholder = "0",
}: {
  value: number;
  onChangeValue: (n: number) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      style={[styles.input, styles.right]}
      value={value ? value.toLocaleString("en-US") : ""}
      onChangeText={(text) => {
        const raw = text.replace(/[^0-9]/g, "");
        onChangeValue(raw ? Number(raw) : 0);
      }}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType="numeric"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  right: { textAlign: "right" },
});

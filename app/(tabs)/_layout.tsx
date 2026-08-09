import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocale } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import { useAuth } from "@/hooks/useAuth";

export default function TabsLayout() {
  const { t } = useLocale();
  const { isAdmin } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.positive,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 52 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t.nav.dashboard,
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: t.nav.employees,
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: t.nav.assets,
          tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: t.nav.expenses,
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="receivables"
        options={{
          title: t.nav.receivables,
          tabBarIcon: ({ color, size }) => <Ionicons name="swap-horizontal" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t.nav.transactions,
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t.nav.more,
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workforce"
        options={{
          title: t.nav.workforce,
          href: null,
        }}
      />
      <Tabs.Screen
        name="partners"
        options={{
          title: t.nav.partners,
          href: null,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t.nav.admin,
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}

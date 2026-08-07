export const colors = {
  bg: "#080d18",
  card: "#111a2e",
  cardAlt: "#0f1830",
  border: "#1f2b45",
  borderLight: "#2a3958",
  text: "#f8fafc",
  muted: "#8b9ac2",
  positive: "#34d399",
  negative: "#f87171",
  info: "#38bdf8",
  warn: "#fbbf24",
  primary: "#22c55e",
  accent: "#818cf8",
};

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  glow: {
    shadowColor: colors.positive,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
};

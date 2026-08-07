import { useWindowDimensions } from "react-native";

const TABLET_BREAKPOINT = 768;

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  return {
    width,
    isTablet,
    statCardBasis: isTablet ? ("23%" as const) : ("48%" as const),
  };
}

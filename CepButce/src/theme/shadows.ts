import { Platform, ViewStyle } from 'react-native';

export const shadows: { card: ViewStyle; fab: ViewStyle } = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  fab: Platform.select({
    ios: {
      shadowColor: '#00C864',
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
    },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle,
};

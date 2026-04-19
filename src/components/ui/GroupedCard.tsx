import React, { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

interface GroupedCardHeader {
  label: string;
  rightText?: string;
}

interface GroupedCardProps {
  header?: GroupedCardHeader;
  children: ReactNode;
  style?: ViewStyle;
}

interface GroupedCardRowProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

function GroupedCardBase({ header, children, style }: GroupedCardProps) {
  const { theme } = useTheme();
  const rows = React.Children.toArray(children).filter(Boolean);

  return (
    <View>
      {header && (
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.headerLabel,
              { color: theme.colors.text.secondary },
            ]}>
            {header.label.toLocaleUpperCase()}
          </Text>
          {header.rightText !== undefined && (
            <Text
              style={[
                styles.headerRight,
                { color: theme.colors.text.secondary },
              ]}>
              {header.rightText}
            </Text>
          )}
        </View>
      )}
      <View
        style={[
          {
            backgroundColor: theme.colors.bg.card,
            borderColor: theme.colors.border.card,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: theme.radius.group,
            overflow: 'hidden',
          },
          style,
        ]}>
        {rows.map((child, i) => (
          <View
            key={i}
            style={{
              borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
              borderTopColor: theme.colors.border.card,
            }}>
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}

function Row({ children, onPress, style }: GroupedCardRowProps) {
  // Pressable's intrinsic sizing can swallow `flex: 1` children when it isn't
  // forced to stretch to the card width. Wrapping the layout in a plain View
  // and letting Pressable own only press-feedback keeps flex-row reliable.
  const layout = <View style={[styles.row, style]}>{children}</View>;
  if (!onPress) return layout;
  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      {({ pressed }) => (
        <View style={[styles.row, style, pressed && { opacity: 0.6 }]}>
          {children}
        </View>
      )}
    </Pressable>
  );
}

export const GroupedCard = Object.assign(GroupedCardBase, { Row });

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  headerRight: {
    fontSize: 11,
    fontWeight: '500',
  },
  pressable: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
  },
});

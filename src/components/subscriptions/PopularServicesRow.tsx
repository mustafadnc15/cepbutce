import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';

import { useTheme } from '../../theme';
import { POPULAR_SERVICES, PopularService } from '../../constants/popularServices';

interface PopularServicesRowProps {
  onPick: (service: PopularService) => void;
}

export function PopularServicesRow({ onPick }: PopularServicesRowProps) {
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}>
      {POPULAR_SERVICES.map((service) => {
        const initial = service.name[0].toLocaleUpperCase('tr-TR');
        return (
          <Pressable
            key={service.id}
            onPress={() => {
              HapticFeedback.trigger('impactLight');
              onPick(service);
            }}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.bg.page,
                borderColor: theme.colors.border.card,
              },
            ]}>
            <View style={[styles.circle, { backgroundColor: service.color }]}>
              <Text style={styles.initial}>{initial}</Text>
            </View>
            <Text
              style={[styles.name, { color: theme.colors.text.primary }]}
              numberOfLines={1}>
              {service.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 10,
    paddingRight: 8,
  },
  card: {
    width: 92,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    alignItems: 'center',
    gap: 8,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  name: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});

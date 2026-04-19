import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '@react-native-vector-icons/feather';

import { colorsLight } from '../theme/colors';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

// Catches render errors so a single screen crash doesn't leave the user
// staring at a white screen. Uses the light-theme palette directly because
// the theme provider may not have mounted yet when this catches.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.root}>
          <View style={styles.iconCircle}>
            <Icon name="alert-triangle" size={28} color={colorsLight.semantic.error} />
          </View>
          <Text style={styles.title}>Bir şeyler ters gitti</Text>
          <Text style={styles.body}>
            {this.state.error.message || 'Beklenmeyen bir hata oluştu.'}
          </Text>
          <Pressable onPress={this.reset} style={styles.btn}>
            <Icon name="rotate-ccw" size={16} color="#FFFFFF" />
            <Text style={styles.btnText}>Tekrar Dene</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: colorsLight.bg.page,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDEAEA',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colorsLight.text.primary,
    marginTop: 8,
  },
  body: {
    fontSize: 14,
    color: colorsLight.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colorsLight.brand.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

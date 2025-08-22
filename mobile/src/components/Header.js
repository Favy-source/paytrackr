import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';

export default function Header({ title, subtitle, showBack = false, onBackPress, actions = [] }) {
  const theme = useTheme();

  return (
    <Appbar.Header style={[styles.header, { backgroundColor: theme.colors.primary }]}>
      {showBack && (
        <Appbar.BackAction onPress={onBackPress} color={theme.colors.onPrimary} />
      )}
      <Appbar.Content
        title={title}
        subtitle={subtitle}
        titleStyle={[styles.title, { color: theme.colors.onPrimary }]}
        subtitleStyle={[styles.subtitle, { color: theme.colors.onPrimary }]}
      />
      {actions.map((action, index) => (
        <Appbar.Action
          key={index}
          icon={action.icon}
          onPress={action.onPress}
          color={theme.colors.onPrimary}
        />
      ))}
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  header: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
});

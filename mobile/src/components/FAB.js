import React from 'react';
import { StyleSheet } from 'react-native';
import { FAB as PaperFAB } from 'react-native-paper';

export default function FAB({ icon = 'plus', onPress, style, ...props }) {
  return (
    <PaperFAB
      icon={icon}
      onPress={onPress}
      style={[styles.fab, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});

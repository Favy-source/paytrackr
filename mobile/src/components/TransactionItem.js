import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CURRENCY } from '../utils/constants';

export default function TransactionItem({ transaction, onPress }) {
  const theme = useTheme();

  const getTransactionIcon = (category, type) => {
    const iconMap = {
      food: 'food',
      transportation: 'car',
      housing: 'home',
      utilities: 'lightning-bolt',
      healthcare: 'medical-bag',
      entertainment: 'gamepad-variant',
      shopping: 'shopping',
      salary: 'cash',
      freelance: 'account-tie',
      business: 'briefcase',
      investment: 'chart-line',
    };
    return iconMap[category] || (type === 'income' ? 'plus-circle' : 'minus-circle');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.content}>
            <View style={styles.leftSection}>
              <MaterialCommunityIcons
                name={getTransactionIcon(transaction.category, transaction.type)}
                size={24}
                color={transaction.type === 'income' ? '#4CAF50' : '#F44336'}
              />
              <View style={styles.details}>
                <Title style={styles.description}>
                  {transaction.description || transaction.category}
                </Title>
                <Paragraph style={styles.category}>
                  {transaction.category.replace('_', ' ').toUpperCase()}
                </Paragraph>
              </View>
            </View>
            
            <View style={styles.rightSection}>
              <Title
                style={[
                  styles.amount,
                  { color: transaction.type === 'income' ? '#4CAF50' : '#F44336' }
                ]}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {CURRENCY.SYMBOL}{transaction.amount}
              </Title>
              <Paragraph style={styles.date}>
                {formatDate(transaction.date)}
              </Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  details: {
    marginLeft: 12,
    flex: 1,
  },
  description: {
    fontSize: 16,
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    opacity: 0.7,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
  },
});

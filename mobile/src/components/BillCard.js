import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CURRENCY } from '../utils/constants';

export default function BillCard({ bill, onPress, onMarkPaid }) {
  const theme = useTheme();
  
  const getBillStatus = () => {
    const dueDate = new Date(bill.dueDate);
    const now = new Date();
    
    if (bill.status === 'paid') return { status: 'paid', color: '#4CAF50' };
    if (dueDate < now) return { status: 'overdue', color: '#F44336' };
    if (dueDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return { status: 'due soon', color: '#FF9800' };
    }
    return { status: 'upcoming', color: '#2196F3' };
  };

  const getBillIcon = (category) => {
    const iconMap = {
      utilities: 'lightning-bolt',
      rent: 'home',
      insurance: 'shield-check',
      subscriptions: 'card-multiple',
      internet: 'wifi',
      phone: 'phone',
      food: 'food',
      transportation: 'car',
      healthcare: 'medical-bag',
      entertainment: 'gamepad-variant',
    };
    return iconMap[category] || 'file-document';
  };

  const { status, color } = getBillStatus();

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.billInfo}>
              <MaterialCommunityIcons
                name={getBillIcon(bill.category)}
                size={24}
                color={color}
              />
              <View style={styles.billDetails}>
                <Title style={styles.title}>{bill.title}</Title>
                <Paragraph style={styles.category}>
                  {bill.category.replace('_', ' ').toUpperCase()}
                </Paragraph>
              </View>
            </View>
            <View style={styles.amountContainer}>
              <Title style={styles.amount}>
                {CURRENCY.SYMBOL}{bill.amount}
              </Title>
              <Paragraph style={styles.dueDate}>
                Due: {new Date(bill.dueDate).toLocaleDateString()}
              </Paragraph>
            </View>
          </View>
          
          <View style={styles.footer}>
            <Chip
              mode="outlined"
              style={[styles.statusChip, { borderColor: color }]}
              textStyle={{ color }}
            >
              {status.toUpperCase()}
            </Chip>
            
            {status !== 'paid' && (
              <Button
                mode="contained-tonal"
                onPress={() => onMarkPaid(bill._id)}
                style={styles.payButton}
                compact
              >
                Mark Paid
              </Button>
            )}
          </View>

          {bill.description && (
            <Paragraph style={styles.description}>
              {bill.description}
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  billDetails: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    opacity: 0.7,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
  },
  dueDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    height: 24,
  },
  payButton: {
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
});

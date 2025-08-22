import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  FAB,
  List,
  Divider,
  Button,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../components/Header';
import { incomeAPI } from '../services/api';
import { CURRENCY, INCOME_FREQUENCIES } from '../utils/constants';

export default function IncomeSettingsScreen({ navigation }) {
  const theme = useTheme();
  const [incomeSources, setIncomeSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    totalMonthly: 0,
    activeSourcesCount: 0,
    nextPayment: null,
  });

  useEffect(() => {
    fetchIncomeData();
  }, []);

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      const [sourcesResponse, summaryResponse] = await Promise.all([
        incomeAPI.getAll(),
        incomeAPI.getSummary(),
      ]);

      if (sourcesResponse.status === 'success') {
        setIncomeSources(sourcesResponse.data.income || []);
      }

      if (summaryResponse.status === 'success') {
        setSummary(summaryResponse.data || {});
      }
    } catch (error) {
      console.error('Error fetching income data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIncomeData();
    setRefreshing(false);
  };

  const getFrequencyDisplay = (frequency) => {
    const displays = {
      'one-time': 'One-time',
      'daily': 'Daily',
      'weekly': 'Weekly',
      'bi-weekly': 'Bi-weekly',
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'yearly': 'Yearly',
    };
    return displays[frequency] || frequency;
  };

  const getIncomeIcon = (category) => {
    const iconMap = {
      salary: 'cash',
      freelance: 'account-tie',
      business: 'briefcase',
      investment: 'chart-line',
      rental: 'home-city',
      pension: 'account-clock',
      benefits: 'hand-heart',
      gift: 'gift',
      bonus: 'star-circle',
    };
    return iconMap[category] || 'cash-plus';
  };

  const renderIncomeSource = (source) => (
    <View key={source._id}>
      <List.Item
        title={source.source}
        description={`${getFrequencyDisplay(source.frequency)} • ${source.category.replace('_', ' ').toUpperCase()}`}
        left={(props) => (
          <List.Icon
            {...props}
            icon={getIncomeIcon(source.category)}
            color={source.isActive ? theme.colors.primary : theme.colors.disabled}
          />
        )}
        right={(props) => (
          <View style={styles.incomeAmount}>
            <Paragraph style={[styles.amount, { color: theme.colors.primary }]}>
              {CURRENCY.SYMBOL}{source.amount}
            </Paragraph>
            {source.nextExpectedDate && (
              <Paragraph style={styles.nextDate}>
                Next: {new Date(source.nextExpectedDate).toLocaleDateString()}
              </Paragraph>
            )}
          </View>
        )}
        onPress={() => navigation.navigate('EditIncome', { incomeId: source._id })}
        style={[
          styles.incomeItem,
          !source.isActive && styles.inactiveItem
        ]}
      />
      <Divider />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Income Settings" />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Income Summary</Title>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Title style={[styles.summaryAmount, { color: theme.colors.primary }]}>
                  {CURRENCY.SYMBOL}{summary.totalMonthly?.toLocaleString() || 0}
                </Title>
                <Paragraph>Monthly Income</Paragraph>
              </View>
              <View style={styles.summaryItem}>
                <Title style={[styles.summaryAmount, { color: theme.colors.secondary }]}>
                  {summary.activeSourcesCount || 0}
                </Title>
                <Paragraph>Active Sources</Paragraph>
              </View>
            </View>
            
            {summary.nextPayment && (
              <View style={styles.nextPaymentContainer}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={20}
                  color={theme.colors.primary}
                />
                <Paragraph style={styles.nextPaymentText}>
                  Next payment: {new Date(summary.nextPayment.date).toLocaleDateString()} 
                  ({CURRENCY.SYMBOL}{summary.nextPayment.amount})
                </Paragraph>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Income Sources */}
        <Card style={styles.sourcesCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title>Income Sources</Title>
              <Button
                mode="text"
                onPress={() => navigation.navigate('AddIncome')}
              >
                Add New
              </Button>
            </View>
            
            {incomeSources.length > 0 ? (
              <View style={styles.sourcesList}>
                {incomeSources.map(renderIncomeSource)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="cash-plus"
                  size={64}
                  color={theme.colors.disabled}
                />
                <Title style={styles.emptyTitle}>No Income Sources</Title>
                <Paragraph style={styles.emptyText}>
                  Add your income sources to track your earnings and plan your budget
                </Paragraph>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('AddIncome')}
                  style={styles.addButton}
                >
                  Add Income Source
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title style={styles.actionsTitle}>Quick Actions</Title>
            <View style={styles.actions}>
              <Button
                mode="outlined"
                icon="chart-line"
                onPress={() => navigation.navigate('IncomeProjections')}
                style={styles.actionButton}
              >
                View Projections
              </Button>
              <Button
                mode="outlined"
                icon="history"
                onPress={() => navigation.navigate('IncomeHistory')}
                style={styles.actionButton}
              >
                Income History
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddIncome')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryCard: {
    marginVertical: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  nextPaymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  nextPaymentText: {
    marginLeft: 8,
    flex: 1,
  },
  sourcesCard: {
    marginVertical: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sourcesList: {
    marginTop: 8,
  },
  incomeItem: {
    paddingVertical: 8,
  },
  inactiveItem: {
    opacity: 0.6,
  },
  incomeAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  addButton: {
    paddingHorizontal: 24,
  },
  actionsCard: {
    marginVertical: 8,
    elevation: 4,
  },
  actionsTitle: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

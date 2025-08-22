import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  ProgressBar,
  Chip,
  List,
  IconButton,
  Dialog,
  Portal,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import Header from '../components/Header';
import FAB from '../components/FAB';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function BudgetPlanningScreen({ navigation }) {
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  const [budgets, setBudgets] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [newBudget, setNewBudget] = useState({
    category: '',
    limit: '',
    period: 'monthly',
  });

  // Sample budget data
  const sampleBudgets = [
    {
      id: '1',
      category: 'Food & Dining',
      limit: 800,
      spent: 520,
      period: 'monthly',
      color: '#FF6B6B',
    },
    {
      id: '2',
      category: 'Transportation',
      limit: 400,
      spent: 280,
      period: 'monthly',
      color: '#4ECDC4',
    },
    {
      id: '3',
      category: 'Entertainment',
      limit: 300,
      spent: 450,
      period: 'monthly',
      color: '#45B7D1',
    },
    {
      id: '4',
      category: 'Shopping',
      limit: 500,
      spent: 320,
      period: 'monthly',
      color: '#96CEB4',
    },
  ];

  useEffect(() => {
    setBudgets(sampleBudgets);
  }, []);

  const handleAddBudget = () => {
    if (!newBudget.category || !newBudget.limit) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const budget = {
      id: Date.now().toString(),
      category: newBudget.category,
      limit: parseFloat(newBudget.limit),
      spent: 0,
      period: newBudget.period,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    };

    setBudgets([...budgets, budget]);
    setNewBudget({ category: '', limit: '', period: 'monthly' });
    setShowAddDialog(false);
  };

  const getBudgetStatus = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage > 100) return { status: 'over', color: theme.colors.error };
    if (percentage > 80) return { status: 'warning', color: theme.colors.warning };
    return { status: 'good', color: theme.colors.success };
  };

  const getTotalBudget = () => {
    return budgets.reduce((total, budget) => total + budget.limit, 0);
  };

  const getTotalSpent = () => {
    return budgets.reduce((total, budget) => total + budget.spent, 0);
  };

  const getChartData = () => {
    return budgets.map(budget => ({
      name: budget.category,
      population: budget.spent,
      color: budget.color,
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    }));
  };

  const getSpendingTrendData = () => {
    return {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          data: [400, 600, 800, 1200],
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: [500, 700, 900, 1100], // Budget line
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2,
          strokeDashArray: [5, 5],
        },
      ],
      legend: ['Actual Spending', 'Budget Target'],
    };
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.onSurface,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Budget Planning"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content}>
        {/* Budget Overview */}
        <Card style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>Budget Overview</Title>
            <View style={styles.overviewStats}>
              <View style={styles.statItem}>
                <Paragraph style={{ color: theme.colors.onSurface }}>Total Budget</Paragraph>
                <Title style={{ color: theme.colors.primary }}>
                  ${getTotalBudget().toLocaleString()}
                </Title>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={{ color: theme.colors.onSurface }}>Total Spent</Paragraph>
                <Title style={{ color: theme.colors.error }}>
                  ${getTotalSpent().toLocaleString()}
                </Title>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={{ color: theme.colors.onSurface }}>Remaining</Paragraph>
                <Title style={{ color: theme.colors.success }}>
                  ${(getTotalBudget() - getTotalSpent()).toLocaleString()}
                </Title>
              </View>
            </View>
            <ProgressBar
              progress={getTotalSpent() / getTotalBudget()}
              color={getTotalSpent() > getTotalBudget() ? theme.colors.error : theme.colors.primary}
              style={styles.overviewProgress}
            />
          </Card.Content>
        </Card>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <Chip
            selected={selectedPeriod === 'weekly'}
            onPress={() => setSelectedPeriod('weekly')}
            style={styles.periodChip}
          >
            Weekly
          </Chip>
          <Chip
            selected={selectedPeriod === 'monthly'}
            onPress={() => setSelectedPeriod('monthly')}
            style={styles.periodChip}
          >
            Monthly
          </Chip>
          <Chip
            selected={selectedPeriod === 'yearly'}
            onPress={() => setSelectedPeriod('yearly')}
            style={styles.periodChip}
          >
            Yearly
          </Chip>
        </View>

        {/* Spending Trend Chart */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>Spending Trend</Title>
            <LineChart
              data={getSpendingTrendData()}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              bezier
            />
          </Card.Content>
        </Card>

        {/* Category Breakdown */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>Category Breakdown</Title>
            <PieChart
              data={getChartData()}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Budget Categories */}
        <Card style={[styles.categoriesCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>Budget Categories</Title>
            {budgets.map((budget) => {
              const percentage = (budget.spent / budget.limit) * 100;
              const { status, color } = getBudgetStatus(budget.spent, budget.limit);
              
              return (
                <View key={budget.id} style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetInfo}>
                      <View style={[styles.categoryColor, { backgroundColor: budget.color }]} />
                      <View style={styles.budgetDetails}>
                        <Paragraph style={[styles.categoryName, { color: theme.colors.onSurface }]}>
                          {budget.category}
                        </Paragraph>
                        <Paragraph style={[styles.budgetAmount, { color: theme.colors.onSurface }]}>
                          ${budget.spent} / ${budget.limit}
                        </Paragraph>
                      </View>
                    </View>
                    <View style={styles.budgetActions}>
                      <Paragraph style={[styles.percentageText, { color }]}>
                        {percentage.toFixed(0)}%
                      </Paragraph>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => Alert.alert('Edit Budget', 'Edit budget feature coming soon')}
                      />
                    </View>
                  </View>
                  <ProgressBar
                    progress={Math.min(percentage / 100, 1)}
                    color={color}
                    style={styles.budgetProgress}
                  />
                </View>
              );
            })}
          </Card.Content>
        </Card>

        {/* Budget Tips */}
        <Card style={[styles.tipsCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>Budget Tips</Title>
            <View style={styles.tip}>
              <MaterialCommunityIcons name="lightbulb" size={20} color={theme.colors.primary} />
              <Paragraph style={[styles.tipText, { color: theme.colors.onSurface }]}>
                Set realistic budget limits based on your past spending patterns
              </Paragraph>
            </View>
            <View style={styles.tip}>
              <MaterialCommunityIcons name="lightbulb" size={20} color={theme.colors.primary} />
              <Paragraph style={[styles.tipText, { color: theme.colors.onSurface }]}>
                Review and adjust your budgets monthly to stay on track
              </Paragraph>
            </View>
            <View style={styles.tip}>
              <MaterialCommunityIcons name="lightbulb" size={20} color={theme.colors.primary} />
              <Paragraph style={[styles.tipText, { color: theme.colors.onSurface }]}>
                Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings
              </Paragraph>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        onPress={() => setShowAddDialog(true)}
      />

      {/* Add Budget Dialog */}
      <Portal>
        <Dialog
          visible={showAddDialog}
          onDismiss={() => setShowAddDialog(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Add New Budget</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Category"
              value={newBudget.category}
              onChangeText={(text) => setNewBudget({ ...newBudget, category: text })}
              style={styles.input}
            />
            <TextInput
              label="Budget Limit"
              value={newBudget.limit}
              onChangeText={(text) => setNewBudget({ ...newBudget, limit: text })}
              keyboardType="numeric"
              style={styles.input}
            />
            <View style={styles.periodOptions}>
              <Title style={{ color: theme.colors.onSurface, fontSize: 16 }}>Period</Title>
              <View style={styles.periodChips}>
                <Chip
                  selected={newBudget.period === 'weekly'}
                  onPress={() => setNewBudget({ ...newBudget, period: 'weekly' })}
                  style={styles.periodChip}
                >
                  Weekly
                </Chip>
                <Chip
                  selected={newBudget.period === 'monthly'}
                  onPress={() => setNewBudget({ ...newBudget, period: 'monthly' })}
                  style={styles.periodChip}
                >
                  Monthly
                </Chip>
                <Chip
                  selected={newBudget.period === 'yearly'}
                  onPress={() => setNewBudget({ ...newBudget, period: 'yearly' })}
                  style={styles.periodChip}
                >
                  Yearly
                </Chip>
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onPress={handleAddBudget}>Add Budget</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  overviewCard: {
    marginVertical: 16,
    elevation: 4,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  overviewProgress: {
    height: 6,
    borderRadius: 3,
    marginTop: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  periodChip: {
    marginHorizontal: 4,
  },
  chartCard: {
    marginVertical: 8,
    elevation: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoriesCard: {
    marginVertical: 8,
    elevation: 4,
  },
  budgetItem: {
    marginVertical: 12,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  budgetDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  budgetAmount: {
    fontSize: 14,
    opacity: 0.7,
  },
  budgetActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  budgetProgress: {
    height: 6,
    borderRadius: 3,
  },
  tipsCard: {
    marginVertical: 16,
    marginBottom: 32,
    elevation: 2,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  tipText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
  },
  input: {
    marginBottom: 16,
  },
  periodOptions: {
    marginTop: 8,
  },
  periodChips: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
});

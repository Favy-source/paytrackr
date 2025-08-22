import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  SegmentedButtons,
  useTheme,
} from 'react-native-paper';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import Header from '../components/Header';
import { analyticsAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [analyticsData, setAnalyticsData] = useState({
    spending: [],
    trends: [],
    categoryBreakdown: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      const [spendingResponse, trendsResponse] = await Promise.all([
        analyticsAPI.getSpending({ period: selectedPeriod }),
        analyticsAPI.getTrends({ months: selectedPeriod === 'year' ? 12 : 6 }),
      ]);

      setAnalyticsData({
        spending: spendingResponse.data || [],
        trends: trendsResponse.data || [],
        categoryBreakdown: spendingResponse.data?.categoryBreakdown || [],
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  // Sample data for charts
  const spendingTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [2000, 2200, 1800, 2500, 2300, 2600],
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // Expenses
        strokeWidth: 2,
      },
      {
        data: [3000, 3200, 2800, 3500, 3300, 3600],
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Income
        strokeWidth: 2,
      },
    ],
    legend: ['Expenses', 'Income'],
  };

  const categoryData = [
    {
      name: 'Food',
      amount: 800,
      color: '#FF6384',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Transport',
      amount: 600,
      color: '#36A2EB',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Bills',
      amount: 1200,
      color: '#FFCE56',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Entertainment',
      amount: 400,
      color: '#4BC0C0',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Shopping',
      amount: 500,
      color: '#9966FF',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ];

  const monthlyComparisonData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        data: [500, 600, 450, 700],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(81, 149, 255, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.onSurface,
    style: {
      borderRadius: 16,
    },
  };

  return (
    <View style={styles.container}>
      <Header title="Analytics" />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            buttons={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
          />
        </View>

        {/* Income vs Expenses Trend */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Income vs Expenses</Title>
            <Paragraph style={styles.subtitle}>
              Track your financial flow over time
            </Paragraph>
            <LineChart
              data={spendingTrendData}
              width={width - 60}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Category Breakdown */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Spending by Category</Title>
            <Paragraph style={styles.subtitle}>
              See where your money goes
            </Paragraph>
            <PieChart
              data={categoryData}
              width={width - 60}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Weekly Spending Pattern */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Weekly Spending Pattern</Title>
            <Paragraph style={styles.subtitle}>
              This month's weekly breakdown
            </Paragraph>
            <BarChart
              data={monthlyComparisonData}
              width={width - 60}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          </Card.Content>
        </Card>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Title style={styles.statNumber}>$3,500</Title>
              <Paragraph>Average Monthly Income</Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Title style={[styles.statNumber, { color: '#F44336' }]}>$2,300</Title>
              <Paragraph>Average Monthly Expenses</Paragraph>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Title style={[styles.statNumber, { color: '#4CAF50' }]}>$1,200</Title>
              <Paragraph>Monthly Savings</Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Title style={[styles.statNumber, { color: '#FF9800' }]}>34%</Title>
              <Paragraph>Savings Rate</Paragraph>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
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
  periodSelector: {
    marginVertical: 16,
  },
  chartCard: {
    marginVertical: 8,
    elevation: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

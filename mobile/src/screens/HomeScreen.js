import { StatusBar } from 'expo-status-bar';
import React, { useState, useContext } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  FAB,
  Text,
  Surface,
  useTheme,
  Button,
  Avatar,
} from 'react-native-paper';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Header from '../components/Header';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalIncome: 5000,
    totalExpenses: 3200,
    totalBills: 8,
    upcomingBills: 3,
    recentTransactions: [],
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch fresh data from API
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const handleReferral = () => {
    navigation.navigate('Referral');
  };

  const balance = dashboardData.totalIncome - dashboardData.totalExpenses;

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [2000, 2500, 2200, 2800, 3000, 3200],
        color: (opacity = 1) => `rgba(81, 149, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const expenseData = [
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
      name: 'Other',
      amount: 600,
      color: '#4BC0C0',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
            <Header
        title="PayTrackr"
        subtitle="Your Financial Dashboard"
        actions={[
          {
            icon: 'cog',
            onPress: () => navigation.navigate('Settings'),
          },
        ]}
      />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Referral Card */}
        {user?.referralCode && (
          <Card style={styles.referralCard}>
            <Card.Content>
              <View style={styles.referralHeader}>
                <View style={styles.referralContent}>
                  <Title style={styles.referralTitle}>Invite friends, earn points!</Title>
                  <Paragraph style={styles.referralSubtitle}>
                    Share your referral code and earn 100 points for each friend who joins PayTrackr.
                  </Paragraph>
                  <View style={styles.referralCodeContainer}>
                    <Text style={styles.referralCodeLabel}>Your code:</Text>
                    <Text style={styles.referralCode}>{user.referralCode}</Text>
                  </View>
                  <View style={styles.pointsContainer}>
                    <MaterialCommunityIcons name="star-circle" size={20} color="#FFD700" />
                    <Text style={styles.pointsText}>{user.points || 0} points</Text>
                  </View>
                </View>
                <Avatar.Icon
                  size={60}
                  icon="gift"
                  style={styles.referralIcon}
                />
              </View>
              <Button
                mode="contained"
                onPress={handleReferral}
                style={styles.referralButton}
                icon="share"
              >
                Share & Earn
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <Card.Content>
            <Title style={styles.balanceTitle}>Current Balance</Title>
            <Text style={[styles.balanceAmount, { color: balance >= 0 ? '#4CAF50' : '#F44336' }]}>
              ${balance.toLocaleString()}
            </Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Income</Text>
                <Text style={[styles.balanceValue, { color: '#4CAF50' }]}>
                  +${dashboardData.totalIncome.toLocaleString()}
                </Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Expenses</Text>
                <Text style={[styles.balanceValue, { color: '#F44336' }]}>
                  -${dashboardData.totalExpenses.toLocaleString()}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <Surface style={styles.statCard}>
            <Text style={styles.statNumber}>{dashboardData.totalBills}</Text>
            <Text style={styles.statLabel}>Total Bills</Text>
          </Surface>
          <Surface style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>
              {dashboardData.upcomingBills}
            </Text>
            <Text style={styles.statLabel}>Due Soon</Text>
          </Surface>
        </View>

        {/* Spending Trend Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Spending Trend</Title>
            <LineChart
              data={chartData}
              width={width - 60}
              height={200}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(81, 149, 255, ${opacity})`,
                labelColor: (opacity = 1) => theme.colors.onSurface,
              }}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* Expense Breakdown */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Expense Breakdown</Title>
            <PieChart
              data={expenseData}
              width={width - 60}
              height={200}
              chartConfig={{
                color: (opacity = 1) => theme.colors.onSurface,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Transactions', { screen: 'Add' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  referralCard: {
    marginVertical: 8,
    backgroundColor: '#E8F5E8',
    elevation: 4,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  referralContent: {
    flex: 1,
    marginRight: 16,
  },
  referralTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  referralSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  referralCodeLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  referralCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginLeft: 4,
  },
  referralIcon: {
    backgroundColor: '#4CAF50',
  },
  referralButton: {
    backgroundColor: '#2E7D32',
  },
  balanceCard: {
    marginVertical: 8,
    elevation: 4,
  },
  balanceTitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    margin: 4,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  chartCard: {
    marginVertical: 8,
    elevation: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

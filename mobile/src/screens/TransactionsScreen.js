import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  FAB,
  Searchbar,
  Menu,
  Button,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../components/Header';
import { transactionsAPI } from '../services/api';
import { TRANSACTION_CATEGORIES, CURRENCY } from '../utils/constants';

export default function TransactionsScreen({ navigation }) {
  const theme = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getAll();
      if (response.status === 'success') {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const getTransactionIcon = (category, type) => {
    const iconMap = {
      food: 'food',
      transportation: 'car',
      housing: 'home',
      utilities: 'lightning-bolt',
      healthcare: 'medical-bag',
      entertainment: 'gamepad-variant',
      salary: 'cash',
      freelance: 'account-tie',
      business: 'briefcase',
    };
    return iconMap[category] || (type === 'income' ? 'plus-circle' : 'minus-circle');
  };

  const renderTransaction = ({ item }) => (
    <Card style={styles.transactionCard}>
      <Card.Content>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <MaterialCommunityIcons
              name={getTransactionIcon(item.category, item.type)}
              size={24}
              color={item.type === 'income' ? '#4CAF50' : '#F44336'}
            />
            <View style={styles.transactionDetails}>
              <Title style={styles.transactionTitle}>
                {item.description || item.category}
              </Title>
              <Paragraph style={styles.transactionCategory}>
                {item.category.replace('_', ' ').toUpperCase()}
              </Paragraph>
            </View>
          </View>
          <View style={styles.transactionAmount}>
            <Title
              style={[
                styles.amount,
                { color: item.type === 'income' ? '#4CAF50' : '#F44336' }
              ]}
            >
              {item.type === 'income' ? '+' : '-'}{CURRENCY.SYMBOL}{item.amount}
            </Title>
            <Paragraph style={styles.transactionDate}>
              {new Date(item.date).toLocaleDateString()}
            </Paragraph>
          </View>
        </View>
        <View style={styles.chipContainer}>
          <Chip
            mode="outlined"
            style={[
              styles.typeChip,
              { borderColor: item.type === 'income' ? '#4CAF50' : '#F44336' }
            ]}
            textStyle={{ color: item.type === 'income' ? '#4CAF50' : '#F44336' }}
          >
            {item.type.toUpperCase()}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || transaction.type === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      <Header 
        title="Transactions" 
        actions={[
          {
            icon: 'filter',
            onPress: () => setFilterVisible(true)
          }
        ]}
      />
      
      <View style={styles.content}>
        <Searchbar
          placeholder="Search transactions..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <View style={styles.filterChips}>
          <Chip
            selected={selectedFilter === 'all'}
            onPress={() => setSelectedFilter('all')}
            style={styles.filterChip}
          >
            All
          </Chip>
          <Chip
            selected={selectedFilter === 'income'}
            onPress={() => setSelectedFilter('income')}
            style={styles.filterChip}
          >
            Income
          </Chip>
          <Chip
            selected={selectedFilter === 'expense'}
            onPress={() => setSelectedFilter('expense')}
            style={styles.filterChip}
          >
            Expenses
          </Chip>
        </View>

        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
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
    padding: 16,
  },
  searchbar: {
    marginBottom: 16,
    elevation: 2,
  },
  filterChips: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  list: {
    paddingBottom: 80,
  },
  transactionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    opacity: 0.7,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  typeChip: {
    height: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

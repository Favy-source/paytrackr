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
  Button,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../components/Header';
import BillCard from '../components/BillCard';
import { billsAPI } from '../services/api';

export default function BillsScreen({ navigation }) {
  const theme = useTheme();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await billsAPI.getAll();
      if (response.status === 'success') {
        setBills(response.data.bills || []);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBills();
    setRefreshing(false);
  };

  const markBillAsPaid = async (billId) => {
    try {
      const response = await billsAPI.markAsPaid(billId, {
        paidDate: new Date().toISOString(),
        paidAmount: bills.find(b => b._id === billId)?.amount
      });
      
      if (response.status === 'success') {
        await fetchBills();
      }
    } catch (error) {
      console.error('Error marking bill as paid:', error);
    }
  };

  const getFilteredBills = () => {
    const now = new Date();
    
    switch (activeTab) {
      case 'upcoming':
        return bills.filter(bill => {
          const dueDate = new Date(bill.dueDate);
          return dueDate > now && bill.status !== 'paid';
        });
      case 'overdue':
        return bills.filter(bill => {
          const dueDate = new Date(bill.dueDate);
          return dueDate < now && bill.status !== 'paid';
        });
      case 'paid':
        return bills.filter(bill => bill.status === 'paid');
      default:
        return bills;
    }
  };

  const renderBill = ({ item }) => (
    <BillCard
      bill={item}
      onPress={() => navigation.navigate('BillDetails', { billId: item._id })}
      onMarkPaid={() => markBillAsPaid(item._id)}
    />
  );

  const filteredBills = getFilteredBills();

  return (
    <View style={styles.container}>
      <Header title="Bills" />
      
      <View style={styles.content}>
        <View style={styles.tabContainer}>
          {['all', 'upcoming', 'overdue', 'paid'].map((tab) => (
            <Chip
              key={tab}
              selected={activeTab === tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabChip}
              mode={activeTab === tab ? 'flat' : 'outlined'}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Chip>
          ))}
        </View>

        <FlatList
          data={filteredBills}
          renderItem={renderBill}
          keyExtractor={(item) => item._id}
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
        onPress={() => navigation.navigate('AddBill')}
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  tabChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  list: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

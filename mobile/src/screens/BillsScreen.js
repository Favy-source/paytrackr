// BillsScreen.js
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Title, TextInput, Button, HelperText } from 'react-native-paper';
import { billsAPI } from '../services/api';
import { scheduleBillReminder } from '../utils/notifications';

export default function BillsScreen() {
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    dueDate: '',
    category: '',
    customLabel: '', // ✅ new field
  });
  const [error, setError] = useState('');

  const fetchBills = async () => {
    try {
      const res = await billsAPI.getAll();
      setBills(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await billsAPI.create(form);
      setBills((prev) => [...prev, res.data]);

      // Schedule reminder
      await scheduleBillReminder(res.data);

      setForm({ title: '', amount: '', dueDate: '', category: '', customLabel: '' });
    } catch (e) {
      setError('Failed to create bill');
    }
  };

  const handleDelete = async (id) => {
    try {
      await billsAPI.delete(id);
      setBills((prev) => prev.filter((b) => b._id !== id));
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Card>
        <Card.Content>
          <Title>Create Bill</Title>
          <TextInput
            label="Title"
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
          />
          <TextInput
            label="Amount"
            keyboardType="numeric"
            value={form.amount}
            onChangeText={(text) => setForm({ ...form, amount: text })}
          />
          <TextInput
            label="Due Date (YYYY-MM-DD)"
            value={form.dueDate}
            onChangeText={(text) => setForm({ ...form, dueDate: text })}
          />
          <TextInput
            label="Category"
            value={form.category}
            onChangeText={(text) => setForm({ ...form, category: text })}
          />
          <TextInput
            label="Custom Label"
            value={form.customLabel}
            onChangeText={(text) => setForm({ ...form, customLabel: text })}
          />
          <HelperText type="error" visible={!!error}>{error}</HelperText>

          <Button mode="contained" onPress={handleCreate}>Add Bill</Button>
        </Card.Content>
      </Card>

      <FlatList
        data={bills}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Card style={styles.billCard}>
            <Card.Content>
              <Title>{item.title} - ${item.amount}</Title>
              <Button onPress={() => handleDelete(item._id)} mode="outlined" color="red">
                Delete
              </Button>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  billCard: { marginVertical: 8 },
});

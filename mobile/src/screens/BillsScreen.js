// mobile/src/screens/BillsScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Appbar,
  FAB,
  Portal,
  Dialog,
  Button,
  TextInput,
  HelperText,
  Card,
  Text,
  Chip,
  Divider,
  useTheme,
  Menu,
} from 'react-native-paper';
import dayjs from 'dayjs';
import { billsAPI } from '../services/api';
import { BILL_CATEGORIES } from '../utils/constants';
import { scheduleBillReminder } from '../utils/notifications'; // ✅ device notifications

const CATEGORY_OPTIONS = [...BILL_CATEGORIES, 'custom'];
const FREQ_OPTIONS = ['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'];

// Build a reminder-ready object and schedule it
async function scheduleDeviceReminder(bill) {
  try {
    // bill may be from form payload; normalize what we need
    const due = dayjs(bill.dueDate);
    const daysBefore = bill?.reminderSettings?.daysBefore ?? 3;
    const when = due.subtract(daysBefore, 'day');

    // Ensure it's in the future; if not, schedule at due date
    const fireAt = when.isAfter(dayjs()) ? when : due;

    // This helper expects: { id, title, body, date }
    await scheduleBillReminder({
      id: bill._id || bill.id, // backend returns _id
      title: bill.title || bill.customLabel || 'Bill Reminder',
      body:
        bill.category === 'custom' && bill.customLabel
          ? `${bill.customLabel}: due ${due.format('MMM D, YYYY')}`
          : `${bill.title} due ${due.format('MMM D, YYYY')}`,
      date: fireAt.toDate(),
      payload: {
        billId: bill._id || bill.id,
        amount: bill.amount,
        dueDate: due.toISOString(),
      },
    });
  } catch (e) {
    console.warn('scheduleDeviceReminder failed:', e?.message || e);
  }
}

export default function BillsScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bills, setBills] = useState([]);
  const [menuVisibleId, setMenuVisibleId] = useState(null);

  // Modal state (create/update)
  const [visible, setVisible] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'utilities',
    customLabel: '',
    dueDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
    frequency: 'monthly',
    paymentMethod: 'other',
    reminderSettings: { enabled: true, daysBefore: 3 },
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const resetForm = useCallback(() => {
    setEditingBill(null);
    setForm({
      title: '',
      description: '',
      amount: '',
      category: 'utilities',
      customLabel: '',
      dueDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
      frequency: 'monthly',
      paymentMethod: 'other',
      reminderSettings: { enabled: true, daysBefore: 3 },
      notes: ''
    });
    setErrors({});
  }, []);

  const openCreate = () => {
    resetForm();
    setVisible(true);
  };

  const openEdit = (bill) => {
    setEditingBill(bill);
    setForm({
      title: bill.title || '',
      description: bill.description || '',
      amount: String(bill.amount ?? ''),
      category: bill.category || 'utilities',
      customLabel: bill.customLabel || '',
      dueDate: dayjs(bill.dueDate).format('YYYY-MM-DD'),
      frequency: bill.frequency || 'monthly',
      paymentMethod: bill.paymentMethod || 'other',
      reminderSettings: {
        enabled: bill?.reminderSettings?.enabled ?? true,
        daysBefore: bill?.reminderSettings?.daysBefore ?? 3
      },
      notes: bill.notes || ''
    });
    setErrors({});
    setVisible(true);
  };

  const closeModal = () => setVisible(false);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await billsAPI.getAll({ sortBy: 'dueDate', sortOrder: 'asc', limit: 50 });
      setBills(res.data || []);
    } catch (e) {
      console.error('Fetch bills error', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBills();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const validate = () => {
    const next = {};
    if (!form.title?.trim()) next.title = 'Title is required';
    if (!form.amount || Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      next.amount = 'Valid amount is required';
    }
    if (!form.dueDate) next.dueDate = 'Due date is required';
    if (!form.category) next.category = 'Category is required';
    if (form.category === 'custom' && !form.customLabel?.trim()) {
      next.customLabel = 'Custom label is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      amount: Number(form.amount),
      category: form.category,
      customLabel: form.category === 'custom' ? form.customLabel.trim() : undefined,
      dueDate: new Date(form.dueDate),
      frequency: form.frequency,
      paymentMethod: form.paymentMethod,
      reminderSettings: {
        enabled: !!form.reminderSettings.enabled,
        daysBefore: Number(form.reminderSettings.daysBefore) || 0
      },
      notes: form.notes?.trim() || undefined,
    };

    try {
      if (editingBill) {
        const updated = await billsAPI.update(editingBill._id, payload);
        // ✅ schedule (or reschedule) device reminder if enabled
        if (payload.reminderSettings.enabled) {
          await scheduleDeviceReminder({ ...payload, _id: editingBill._id });
        }
      } else {
        const created = await billsAPI.create(payload);
        // ✅ schedule device reminder on create if enabled
        if (created?.data?.reminderSettings?.enabled || payload.reminderSettings.enabled) {
          await scheduleDeviceReminder(created.data || payload);
        }
      }
      closeModal();
      await fetchBills();
    } catch (e) {
      console.error('Save bill error', e?.response?.data || e.message);
      Alert.alert('Error', e?.response?.data?.message || 'Failed to save bill');
    }
  };

  const confirmDelete = (billId) => {
    Alert.alert(
      'Delete bill',
      'Are you sure you want to delete this bill?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove(billId) }
      ]
    );
  };

  const remove = async (billId) => {
    try {
      await billsAPI.delete(billId);
      setBills((prev) => prev.filter((b) => b._id !== billId));
      // (Optional) You could also cancel scheduled notifications here if you stored notification IDs per bill.
    } catch (e) {
      console.error('Delete bill error', e?.response?.data || e.message);
      Alert.alert('Error', e?.response?.data?.message || 'Failed to delete bill');
    }
  };

  const payNow = async (bill) => {
    try {
      await billsAPI.markAsPaid(bill._id, {
        amount: bill.amount,
        paymentMethod: bill.paymentMethod,
      });
      await fetchBills();
    } catch (e) {
      console.error('Pay bill error', e?.response?.data || e.message);
      Alert.alert('Error', e?.response?.data?.message || 'Failed to mark paid');
    }
  };

  const renderBillTitle = (item) =>
    item.category === 'custom' && item.customLabel
      ? `${item.customLabel} (${item.title})`
      : item.title;

  const statusChip = (bill) => {
    const dueIn = Math.ceil((new Date(bill.dueDate) - Date.now()) / (1000 * 60 * 60 * 24));
    const overdue = bill.status === 'overdue' || dueIn < 0;
    const paid = bill.status === 'paid';
    const label = paid ? 'Paid'
      : overdue ? 'Overdue'
      : `Due in ${dueIn}d`;

    const mode = paid ? 'flat' : overdue ? 'outlined' : 'flat';
    const chipColor = paid
      ? theme.colors.success || '#4CAF50'
      : overdue
        ? theme.colors.error || '#B00020'
        : theme.colors.primary;

    return (
      <Chip
        style={{ marginTop: 6 }}
        mode={mode}
        selectedColor="#fff"
        textStyle={{ color: '#fff' }}
        theme={{ colors: { primary: chipColor } }}
      >
        {label}
      </Chip>
    );
  };

  const BillItem = ({ item }) => (
    <Card style={{ marginHorizontal: 16, marginVertical: 8 }}>
      <TouchableOpacity onLongPress={() => confirmDelete(item._id)} onPress={() => openEdit(item)}>
        <Card.Title
          title={renderBillTitle(item)}
          subtitle={`${item.category === 'custom' && item.customLabel ? `${item.customLabel} • ` : ''}${item.category}  •  ${dayjs(item.dueDate).format('MMM D, YYYY')}`}
          right={() => (
            <Menu
              visible={menuVisibleId === item._id}
              onDismiss={() => setMenuVisibleId(null)}
              anchor={
                <Button onPress={() => setMenuVisibleId(item._id)} compact>
                  Actions
                </Button>
              }
            >
              {item.status !== 'paid' && (
                <Menu.Item onPress={() => { setMenuVisibleId(null); payNow(item); }} title="Mark as paid" />
              )}
              <Menu.Item onPress={() => { setMenuVisibleId(null); openEdit(item); }} title="Edit" />
              <Divider />
              <Menu.Item onPress={() => { setMenuVisibleId(null); confirmDelete(item._id); }} title="Delete" />
            </Menu>
          )}
        />
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="titleLarge">
              {Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(item.amount)}
            </Text>
            {statusChip(item)}
          </View>
          {item.description ? <Text style={{ marginTop: 6, opacity: 0.7 }}>{item.description}</Text> : null}
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  const header = useMemo(() => (
    <Appbar.Header mode="small" elevated>
      <Appbar.Content title="Bills" />
      <Appbar.Action icon="refresh" onPress={fetchBills} />
    </Appbar.Header>
  ), [fetchBills]);

  return (
    <View style={{ flex: 1 }}>
      {header}
      <FlatList
        data={bills}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <BillItem item={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={{ alignItems: 'center', marginTop: 48 }}>
              <Text>No bills yet. Tap + to add one.</Text>
            </View>
          )
        }
      />

      <Portal>
        <Dialog visible={visible} onDismiss={closeModal}>
          <Dialog.Title>{editingBill ? 'Edit Bill' : 'Add Bill'}</Dialog.Title>
          <Dialog.Content>

            <TextInput
              label="Title"
              value={form.title}
              onChangeText={(v) => setForm((s) => ({ ...s, title: v }))}
              error={!!errors.title}
              style={{ marginBottom: 8 }}
            />
            <HelperText type="error" visible={!!errors.title}>{errors.title}</HelperText>

            <TextInput
              label="Description"
              value={form.description}
              onChangeText={(v) => setForm((s) => ({ ...s, description: v }))}
              style={{ marginBottom: 8 }}
            />

            <TextInput
              label="Amount"
              value={form.amount}
              onChangeText={(v) => setForm((s) => ({ ...s, amount: v }))}
              keyboardType={Platform.select({ ios: 'numbers-and-punctuation', android: 'numeric' })}
              error={!!errors.amount}
              style={{ marginBottom: 8 }}
            />
            <HelperText type="error" visible={!!errors.amount}>{errors.amount}</HelperText>

            <TextInput
              label="Category"
              value={form.category}
              onChangeText={(v) => setForm((s) => ({ ...s, category: v }))}
              right={<TextInput.Affix text="type or pick" />}
              style={{ marginBottom: 8 }}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
              {CATEGORY_OPTIONS.map((c) => (
                <Chip
                  key={c}
                  selected={form.category === c}
                  onPress={() => setForm((s) => ({ ...s, category: c }))}
                  style={{ marginRight: 6, marginBottom: 6 }}
                >
                  {c}
                </Chip>
              ))}
            </View>
            {form.category === 'custom' && (
              <>
                <TextInput
                  label="Custom label"
                  value={form.customLabel}
                  onChangeText={(v) => setForm((s) => ({ ...s, customLabel: v }))}
                  error={!!errors.customLabel}
                  style={{ marginBottom: 8 }}
                />
                <HelperText type="error" visible={!!errors.customLabel}>{errors.customLabel}</HelperText>
              </>
            )}

            <TextInput
              label="Due date (YYYY-MM-DD)"
              value={form.dueDate}
              onChangeText={(v) => setForm((s) => ({ ...s, dueDate: v }))}
              error={!!errors.dueDate}
              style={{ marginBottom: 8 }}
            />
            <HelperText type="error" visible={!!errors.dueDate}>{errors.dueDate}</HelperText>

            <Text style={{ marginBottom: 6 }}>Frequency</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
              {FREQ_OPTIONS.map((f) => (
                <Chip
                  key={f}
                  selected={form.frequency === f}
                  onPress={() => setForm((s) => ({ ...s, frequency: f }))}
                  style={{ marginRight: 6, marginBottom: 6 }}
                >
                  {f}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Reminder (days before)"
              value={String(form.reminderSettings.daysBefore)}
              onChangeText={(v) =>
                setForm((s) => ({
                  ...s,
                  reminderSettings: { ...s.reminderSettings, daysBefore: v.replace(/\D+/g, '') },
                }))
              }
              keyboardType={Platform.select({ ios: 'numbers-and-punctuation', android: 'numeric' })}
              style={{ marginBottom: 8 }}
            />
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Chip
                selected={!!form.reminderSettings.enabled}
                onPress={() =>
                  setForm((s) => ({
                    ...s,
                    reminderSettings: { ...s.reminderSettings, enabled: !s.reminderSettings.enabled },
                  }))
                }
                style={{ marginRight: 8 }}
              >
                {form.reminderSettings.enabled ? 'Reminders ON' : 'Reminders OFF'}
              </Chip>
            </View>

            <TextInput
              label="Notes (optional)"
              value={form.notes}
              onChangeText={(v) => setForm((s) => ({ ...s, notes: v }))}
              multiline
              style={{ marginBottom: 8 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeModal}>Cancel</Button>
            <Button onPress={submit} mode="contained">
              {editingBill ? 'Save' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon="plus"
        onPress={openCreate}
        style={{
          position: 'absolute',
          right: 16,
          bottom: 24
        }}
      />
    </View>
  );
}

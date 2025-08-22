import React, { useState, useContext } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Chip,
  ProgressBar,
  Dialog,
  Portal,
  Checkbox,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { transactionsAPI, billsAPI, incomeAPI } from '../services/api';

export default function ExportDataScreen({ navigation }) {
  const paperTheme = usePaperTheme();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedData, setSelectedData] = useState({
    transactions: true,
    bills: true,
    income: true,
    analytics: false,
  });
  const [dateRange, setDateRange] = useState('all'); // 'all', 'year', 'month', 'custom'

  const handleExport = async () => {
    try {
      setLoading(true);
      setProgress(0);

      // Collect selected data
      const dataToExport = {};
      
      if (selectedData.transactions) {
        setProgress(0.2);
        const transactions = await transactionsAPI.getTransactions();
        dataToExport.transactions = transactions.data;
      }

      if (selectedData.bills) {
        setProgress(0.4);
        const bills = await billsAPI.getBills();
        dataToExport.bills = bills.data;
      }

      if (selectedData.income) {
        setProgress(0.6);
        const income = await incomeAPI.getIncomes();
        dataToExport.income = income.data;
      }

      setProgress(0.8);

      // Generate file based on format
      let fileContent = '';
      let fileName = '';
      let mimeType = '';

      if (selectedFormat === 'csv') {
        fileContent = generateCSV(dataToExport);
        fileName = `paytrackr_export_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else if (selectedFormat === 'json') {
        fileContent = JSON.stringify(dataToExport, null, 2);
        fileName = `paytrackr_export_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }

      setProgress(0.9);

      // Save file
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, fileContent);

      setProgress(1);

      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: 'Export PayTrackr Data',
        });
      } else {
        Alert.alert('Export Complete', `Data exported successfully to ${fileName}`);
      }

      setShowExportDialog(false);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'There was an error exporting your data. Please try again.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const generateCSV = (data) => {
    let csvContent = '';

    // Transactions CSV
    if (data.transactions && data.transactions.length > 0) {
      csvContent += 'TRANSACTIONS\n';
      csvContent += 'Date,Description,Category,Type,Amount\n';
      data.transactions.forEach(transaction => {
        csvContent += `${transaction.date},${transaction.description},${transaction.category},${transaction.type},${transaction.amount}\n`;
      });
      csvContent += '\n';
    }

    // Bills CSV
    if (data.bills && data.bills.length > 0) {
      csvContent += 'BILLS\n';
      csvContent += 'Name,Category,Amount,Due Date,Status,Frequency\n';
      data.bills.forEach(bill => {
        csvContent += `${bill.name},${bill.category},${bill.amount},${bill.dueDate},${bill.status},${bill.frequency}\n`;
      });
      csvContent += '\n';
    }

    // Income CSV
    if (data.income && data.income.length > 0) {
      csvContent += 'INCOME\n';
      csvContent += 'Source,Category,Amount,Frequency,Next Expected Date\n';
      data.income.forEach(income => {
        csvContent += `${income.source},${income.category},${income.amount},${income.frequency},${income.nextExpectedDate}\n`;
      });
    }

    return csvContent;
  };

  const toggleDataSelection = (key) => {
    setSelectedData(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatLastExport = () => {
    // This would typically come from AsyncStorage or API
    return 'Never exported';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Export Data"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content}>
        {/* Export Info Card */}
        <Card style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons 
                name="download" 
                size={48} 
                color={theme.colors.primary} 
              />
              <View style={styles.infoText}>
                <Title style={{ color: theme.colors.onSurface }}>Export Your Data</Title>
                <Paragraph style={{ color: theme.colors.onSurface }}>
                  Download your financial data in CSV or JSON format
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Last Export Info */}
        <List.Section>
          <List.Item
            title="Last Export"
            description={formatLastExport()}
            left={(props) => <List.Icon {...props} icon="history" color={theme.colors.primary} />}
            style={{ backgroundColor: theme.colors.surface }}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurface }}
          />
        </List.Section>

        {/* Quick Export Options */}
        <Card style={[styles.optionsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>Quick Export</Title>
            <Paragraph style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Export all your data with default settings
            </Paragraph>
            
            <View style={styles.quickExportButtons}>
              <Button
                mode="contained"
                onPress={() => {
                  setSelectedFormat('csv');
                  setSelectedData({
                    transactions: true,
                    bills: true,
                    income: true,
                    analytics: false,
                  });
                  handleExport();
                }}
                style={styles.exportButton}
                icon="file-table"
                disabled={loading}
              >
                Export to CSV
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => {
                  setSelectedFormat('json');
                  setSelectedData({
                    transactions: true,
                    bills: true,
                    income: true,
                    analytics: false,
                  });
                  handleExport();
                }}
                style={styles.exportButton}
                icon="code-json"
                disabled={loading}
              >
                Export to JSON
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Custom Export */}
        <Card style={[styles.optionsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>Custom Export</Title>
            <Paragraph style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Choose specific data and format options
            </Paragraph>
            
            <Button
              mode="outlined"
              onPress={() => setShowExportDialog(true)}
              icon="cog"
              disabled={loading}
            >
              Configure Export
            </Button>
          </Card.Content>
        </Card>

        {/* Export Progress */}
        {loading && (
          <Card style={[styles.progressCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Title style={{ color: theme.colors.onSurface }}>Exporting Data...</Title>
              <ProgressBar 
                progress={progress} 
                color={theme.colors.primary} 
                style={styles.progressBar}
              />
              <Paragraph style={{ color: theme.colors.onSurface, textAlign: 'center' }}>
                {Math.round(progress * 100)}% Complete
              </Paragraph>
            </Card.Content>
          </Card>
        )}

        {/* Export Guidelines */}
        <Card style={[styles.guidelinesCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>Export Guidelines</Title>
            <View style={styles.guideline}>
              <MaterialCommunityIcons name="information" size={20} color={theme.colors.primary} />
              <Paragraph style={[styles.guidelineText, { color: theme.colors.onSurface }]}>
                CSV format is compatible with Excel and Google Sheets
              </Paragraph>
            </View>
            <View style={styles.guideline}>
              <MaterialCommunityIcons name="information" size={20} color={theme.colors.primary} />
              <Paragraph style={[styles.guidelineText, { color: theme.colors.onSurface }]}>
                JSON format preserves all data structure and relationships
              </Paragraph>
            </View>
            <View style={styles.guideline}>
              <MaterialCommunityIcons name="information" size={20} color={theme.colors.primary} />
              <Paragraph style={[styles.guidelineText, { color: theme.colors.onSurface }]}>
                Exported files are saved locally and can be shared or backed up
              </Paragraph>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Custom Export Dialog */}
      <Portal>
        <Dialog
          visible={showExportDialog}
          onDismiss={() => setShowExportDialog(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Configure Export</Dialog.Title>
          <Dialog.Content>
            <Title style={{ color: theme.colors.onSurface, fontSize: 16, marginBottom: 12 }}>
              Select Data to Export
            </Title>
            
            <View style={styles.checkboxOption}>
              <Checkbox
                status={selectedData.transactions ? 'checked' : 'unchecked'}
                onPress={() => toggleDataSelection('transactions')}
                color={theme.colors.primary}
              />
              <Paragraph style={{ color: theme.colors.onSurface, flex: 1 }}>
                Transactions
              </Paragraph>
            </View>
            
            <View style={styles.checkboxOption}>
              <Checkbox
                status={selectedData.bills ? 'checked' : 'unchecked'}
                onPress={() => toggleDataSelection('bills')}
                color={theme.colors.primary}
              />
              <Paragraph style={{ color: theme.colors.onSurface, flex: 1 }}>
                Bills
              </Paragraph>
            </View>
            
            <View style={styles.checkboxOption}>
              <Checkbox
                status={selectedData.income ? 'checked' : 'unchecked'}
                onPress={() => toggleDataSelection('income')}
                color={theme.colors.primary}
              />
              <Paragraph style={{ color: theme.colors.onSurface, flex: 1 }}>
                Income Sources
              </Paragraph>
            </View>

            <Title style={{ color: theme.colors.onSurface, fontSize: 16, marginTop: 20, marginBottom: 12 }}>
              Export Format
            </Title>
            
            <View style={styles.formatOptions}>
              <Chip
                selected={selectedFormat === 'csv'}
                onPress={() => setSelectedFormat('csv')}
                style={styles.formatChip}
              >
                CSV
              </Chip>
              <Chip
                selected={selectedFormat === 'json'}
                onPress={() => setSelectedFormat('json')}
                style={styles.formatChip}
              >
                JSON
              </Chip>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowExportDialog(false)}>Cancel</Button>
            <Button onPress={handleExport} disabled={loading}>Export</Button>
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
  },
  infoCard: {
    marginVertical: 16,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 16,
    flex: 1,
  },
  optionsCard: {
    marginVertical: 8,
    elevation: 4,
  },
  quickExportButtons: {
    gap: 12,
  },
  exportButton: {
    marginVertical: 4,
  },
  progressCard: {
    marginVertical: 16,
    elevation: 4,
  },
  progressBar: {
    marginVertical: 12,
    height: 6,
    borderRadius: 3,
  },
  guidelinesCard: {
    marginVertical: 16,
    marginBottom: 32,
    elevation: 2,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  guidelineText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  formatChip: {
    minWidth: 80,
  },
});

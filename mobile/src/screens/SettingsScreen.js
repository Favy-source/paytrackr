import React, { useState, useContext } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  List,
  Switch,
  Divider,
  Card,
  Title,
  Paragraph,
  Button,
  Dialog,
  Portal,
  RadioButton,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const paperTheme = usePaperTheme();
  const { theme, isDarkMode, themeMode, setLightMode, setDarkMode, setSystemMode } = useTheme();
  const { user, logout } = useContext(AuthContext);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(themeMode);

  const handleThemeChange = () => {
    if (selectedTheme === 'light') {
      setLightMode();
    } else if (selectedTheme === 'dark') {
      setDarkMode();
    } else {
      setSystemMode();
    }
    setShowThemeDialog(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getThemeDisplayName = (mode) => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System Default';
      default:
        return 'System Default';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="Settings"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <Card style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <MaterialCommunityIcons 
                name="account-circle" 
                size={64} 
                color={theme.colors.primary} 
              />
              <View style={styles.profileInfo}>
                <Title style={{ color: theme.colors.onSurface }}>{user?.name}</Title>
                <Paragraph style={{ color: theme.colors.onSurface }}>{user?.email}</Paragraph>
                <Paragraph style={{ color: theme.colors.primary }}>
                  {user?.points || 0} points
                </Paragraph>
              </View>
            </View>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Profile')}
              style={styles.editProfileButton}
            >
              Edit Profile
            </Button>
          </Card.Content>
        </Card>

        {/* Appearance Section */}
        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>Appearance</List.Subheader>
          <List.Item
            title="Theme"
            description={`Current: ${getThemeDisplayName(themeMode)}`}
            left={(props) => <List.Icon {...props} icon="palette" color={theme.colors.primary} />}
            right={(props) => (
              <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurface} />
            )}
            onPress={() => setShowThemeDialog(true)}
            style={{ backgroundColor: theme.colors.surface }}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurface }}
          />
        </List.Section>

        <Divider style={{ backgroundColor: theme.colors.outline }} />

        {/* Notifications Section */}
        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>Notifications</List.Subheader>
          <List.Item
            title="Bill Reminders"
            description="Get notified about upcoming bills"
            left={(props) => <List.Icon {...props} icon="bell" color={theme.colors.primary} />}
            right={() => <Switch value={true} onValueChange={() => {}} />}
            style={{ backgroundColor: theme.colors.surface }}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurface }}
          />
          <List.Item
            title="Budget Alerts"
            description="Notify when approaching budget limits"
            left={(props) => <List.Icon {...props} icon="alert" color={theme.colors.primary} />}
            right={() => <Switch value={true} onValueChange={() => {}} />}
            style={{ backgroundColor: theme.colors.surface }}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurface }}
          />
        </List.Section>

        <Divider style={{ backgroundColor: theme.colors.outline }} />

        {/* Data & Privacy Section */}
        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>Data & Privacy</List.Subheader>
          <List.Item
            title="Export Data"
            description="Export your financial data to CSV/PDF"
            left={(props) => <List.Icon {...props} icon="download" color={theme.colors.primary} />}
            right={(props) => (
              <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurface} />
            )}
            onPress={() => navigation.navigate('ExportData')}
            style={{ backgroundColor: theme.colors.surface }}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurface }}
          />
          <List.Item
            title="Backup & Sync"
            description="Backup your data to cloud storage"
            left={(props) => <List.Icon {...props} icon="cloud-upload" color={theme.colors.primary} />}
            right={(props) => (
              <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurface} />
            )}
            onPress={() => Alert.alert('Coming Soon', 'Cloud backup feature is coming soon!')}
            style={{ backgroundColor: theme.colors.surface }}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurface }}
          />
        </List.Section>

        <Divider style={{ backgroundColor: theme.colors.outline }} />

        {/* Security Section */}
        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>Security</List.Subheader>
          <List.Item
            title="Change Password"
            description="Update your account password"
            left={(props) => <List.Icon {...props} icon="lock" color={theme.colors.primary} />}
            right={(props) => (
              <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurface} />
            )}
            onPress={() => navigation.navigate('ChangePassword')}
            style={{ backgroundColor: theme.colors.surface }}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurface }}
          />
          <List.Item
            title="Two-Factor Authentication"
            description="Add an extra layer of security"
            left={(props) => <List.Icon {...props} icon="shield-check" color={theme.colors.primary} />}
            right={() => <Switch value={false} onValueChange={() => {}} />}
            style={{ backgroundColor: theme.colors.surface }}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurface }}
          />
        </List.Section>

        <Divider style={{ backgroundColor: theme.colors.outline }} />

        {/* About Section */}
        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>About</List.Subheader>
          <List.Item
            title="Help & Support"
            description="Get help and contact support"
            left={(props) => <List.Icon {...props} icon="help-circle" color={theme.colors.primary} />}
            right={(props) => (
              <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurface} />
            )}
            onPress={() => Alert.alert('Support', 'Contact us at support@paytrackr.com')}
            style={{ backgroundColor: theme.colors.surface }}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurface }}
          />
          <List.Item
            title="Privacy Policy"
            description="Review our privacy policy"
            left={(props) => <List.Icon {...props} icon="shield-account" color={theme.colors.primary} />}
            right={(props) => (
              <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurface} />
            )}
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy will be displayed here')}
            style={{ backgroundColor: theme.colors.surface }}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurface }}
          />
          <List.Item
            title="Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" color={theme.colors.primary} />}
            style={{ backgroundColor: theme.colors.surface }}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurface }}
          />
        </List.Section>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={[styles.logoutButton, { borderColor: theme.colors.error }]}
            labelStyle={{ color: theme.colors.error }}
            icon="logout"
          >
            Logout
          </Button>
        </View>
      </ScrollView>

      {/* Theme Selection Dialog */}
      <Portal>
        <Dialog
          visible={showThemeDialog}
          onDismiss={() => setShowThemeDialog(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Choose Theme</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={setSelectedTheme}
              value={selectedTheme}
            >
              <View style={styles.radioOption}>
                <RadioButton value="light" color={theme.colors.primary} />
                <Paragraph style={{ color: theme.colors.onSurface, flex: 1 }}>Light</Paragraph>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="dark" color={theme.colors.primary} />
                <Paragraph style={{ color: theme.colors.onSurface, flex: 1 }}>Dark</Paragraph>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="system" color={theme.colors.primary} />
                <Paragraph style={{ color: theme.colors.onSurface, flex: 1 }}>System Default</Paragraph>
              </View>
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowThemeDialog(false)}>Cancel</Button>
            <Button onPress={handleThemeChange}>Apply</Button>
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
  profileCard: {
    marginVertical: 16,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  editProfileButton: {
    marginTop: 8,
  },
  logoutContainer: {
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  logoutButton: {
    borderWidth: 2,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
});

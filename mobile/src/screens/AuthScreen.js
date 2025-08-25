import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Card, Title, TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

// Google (Expo)
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
WebBrowser.maybeCompleteAuthSession();

const ANDROID_CLIENT_ID = '205115300771-7jo5367ofi1eijt59loseec5dnuj7n70.apps.googleusercontent.com';

export default function AuthScreen() {
  const theme = useTheme();
  const { login, register, loading, loginWithGoogle } = useContext(AuthContext);

  // Expo Google hook
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: ANDROID_CLIENT_ID, // good enough for dev; add iosClientId if needed
  });

  useEffect(() => {
    (async () => {
      if (response?.type === 'success') {
        const idToken = response.authentication?.idToken;
        if (idToken) await loginWithGoogle(idToken);
      }
    })();
  }, [response]);

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name:'', email:'', password:'', confirmPassword:'', referralCode:'' });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const e = {};
    if (!formData.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Email is invalid';
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!isLogin) {
      if (!formData.name) e.name = 'Name is required';
      if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          referralCode: formData.referralCode || undefined,
        });
      }
      if (!result.success) setErrors({ general: result.message });
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' });
    }
  };

  const updateField = (k, v) => {
    setFormData(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: '' }));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Title style={styles.appTitle}>PayTrackr</Title>
          <Title style={styles.subtitle}>{isLogin ? 'Welcome back!' : 'Create your account'}</Title>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            {!isLogin && (
              <>
                <TextInput mode="outlined" label="Full Name" value={formData.name}
                  onChangeText={(t) => updateField('name', t)} error={!!errors.name} style={styles.input} />
                <HelperText type="error" visible={!!errors.name}>{errors.name}</HelperText>
              </>
            )}

            <TextInput mode="outlined" label="Email" value={formData.email}
              onChangeText={(t) => updateField('email', t)} keyboardType="email-address"
              autoCapitalize="none" error={!!errors.email} style={styles.input} />
            <HelperText type="error" visible={!!errors.email}>{errors.email}</HelperText>

            <TextInput mode="outlined" label="Password" value={formData.password}
              onChangeText={(t) => updateField('password', t)} secureTextEntry
              error={!!errors.password} style={styles.input} />
            <HelperText type="error" visible={!!errors.password}>{errors.password}</HelperText>

            {!isLogin && (
              <>
                <TextInput mode="outlined" label="Confirm Password" value={formData.confirmPassword}
                  onChangeText={(t) => updateField('confirmPassword', t)} secureTextEntry
                  error={!!errors.confirmPassword} style={styles.input} />
                <HelperText type="error" visible={!!errors.confirmPassword}>{errors.confirmPassword}</HelperText>

                <TextInput mode="outlined" label="Referral Code (Optional)" value={formData.referralCode}
                  onChangeText={(t) => updateField('referralCode', t.toUpperCase())}
                  autoCapitalize="characters" style={styles.input}
                  right={formData.referralCode ? <TextInput.Icon icon="check-circle" /> : null}
                />
                <HelperText type="info" visible={!isLogin}>
                  Have a friend's referral code? Enter it to earn bonus points!
                </HelperText>
              </>
            )}

            <HelperText type="error" visible={!!errors.general}>{errors.general}</HelperText>

            <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={styles.submitButton}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>

            <Button mode="outlined" onPress={() => promptAsync()} disabled={!request || loading} style={{ marginTop: 12 }}>
              Continue with Google
            </Button>

            <Button mode="text" onPress={() => {
              setIsLogin(!isLogin); setErrors({});
              setFormData({ name:'', email:'', password:'', confirmPassword:'', referralCode:'' });
            }} style={styles.switchButton}>
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.demoCard}>
          <Card.Content>
            <Title style={styles.demoTitle}>Demo Credentials</Title>
            <HelperText type="info">Email: demo@paytrackr.com{'\n'}Password: demo123456</HelperText>
            <Button mode="outlined" onPress={() => {
              setFormData(prev => ({ ...prev, email: 'demo@paytrackr.com', password: 'demo123456' })); setIsLogin(true);
            }} style={styles.demoButton}>
              Use Demo Account
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  header: { alignItems: 'center', marginBottom: 32 },
  appTitle: { fontSize: 32, fontWeight: 'bold', color: '#2196F3', marginBottom: 8 },
  subtitle: { fontSize: 18, opacity: 0.7 },
  card: { elevation: 4, marginBottom: 24 },
  input: { marginBottom: 8 },
  submitButton: { marginTop: 16, paddingVertical: 8 },
  switchButton: { marginTop: 8 },
  demoCard: { elevation: 2, backgroundColor: '#E3F2FD' },
  demoTitle: { fontSize: 16, marginBottom: 8 },
  demoButton: { marginTop: 8 },
});

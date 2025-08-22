import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Custom light theme
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    primaryContainer: '#E3F2FD',
    secondary: '#03DAC6',
    secondaryContainer: '#E0F7FA',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#FAFAFA',
    error: '#B00020',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onSurface: '#000000',
    onBackground: '#000000',
    outline: '#E0E0E0',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3',
  },
};

// Custom dark theme
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#64B5F6',
    primaryContainer: '#1976D2',
    secondary: '#4DD0E1',
    secondaryContainer: '#00ACC1',
    surface: '#121212',
    surfaceVariant: '#1E1E1E',
    background: '#000000',
    error: '#CF6679',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onSurface: '#FFFFFF',
    onBackground: '#FFFFFF',
    outline: '#333333',
    success: '#81C784',
    warning: '#FFB74D',
    info: '#64B5F6',
  },
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, themeMode]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme) {
        const { mode, isDark } = JSON.parse(savedTheme);
        setThemeMode(mode);
        if (mode !== 'system') {
          setIsDarkMode(isDark);
        } else {
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } else {
        // Default to system theme
        setThemeMode('system');
        setIsDarkMode(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      setThemeMode('system');
      setIsDarkMode(systemColorScheme === 'dark');
    }
  };

  const saveThemePreference = async (mode, isDark) => {
    try {
      await AsyncStorage.setItem('theme_preference', JSON.stringify({
        mode,
        isDark
      }));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setLightMode = () => {
    setThemeMode('light');
    setIsDarkMode(false);
    saveThemePreference('light', false);
  };

  const setDarkMode = () => {
    setThemeMode('dark');
    setIsDarkMode(true);
    saveThemePreference('dark', true);
  };

  const setSystemMode = () => {
    setThemeMode('system');
    const systemIsDark = systemColorScheme === 'dark';
    setIsDarkMode(systemIsDark);
    saveThemePreference('system', systemIsDark);
  };

  const toggleTheme = () => {
    if (themeMode === 'light') {
      setDarkMode();
    } else if (themeMode === 'dark') {
      setSystemMode();
    } else {
      setLightMode();
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    theme,
    isDarkMode,
    themeMode,
    setLightMode,
    setDarkMode,
    setSystemMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

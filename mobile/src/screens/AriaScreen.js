import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  TextInput,
  Button,
  Chip,
  Avatar,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../components/Header';
import { chatAPI } from '../services/api';

export default function AriaScreen() {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    loadSuggestions();
    // Add welcome message
    setMessages([
      {
        id: 1,
        text: "Hi! I'm Aria, your personal finance assistant. I can help you with budgeting advice, spending analysis, and financial planning. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  }, []);

  const loadSuggestions = async () => {
    try {
      const response = await chatAPI.getSuggestions();
      if (response.status === 'success') {
        setSuggestions(response.data || []);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      // Fallback suggestions
      setSuggestions([
        "How can I reduce my monthly expenses?",
        "What's my spending pattern this month?",
        "Help me create a budget plan",
        "Show me my biggest expense categories",
      ]);
    }
  };

  const sendMessage = async (messageText = message) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(messageText);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.data?.message || "I'm still learning! This feature will be enhanced soon with AI-powered financial advice.",
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (msg, index) => (
    <View
      key={msg.id || index}
      style={[
        styles.messageContainer,
        msg.sender === 'user' ? styles.userMessage : styles.botMessage,
      ]}
    >
      {msg.sender === 'bot' && (
        <Avatar.Icon
          size={32}
          icon="robot"
          style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
        />
      )}
      <Card
        style={[
          styles.messageCard,
          msg.sender === 'user' ? styles.userCard : styles.botCard,
        ]}
      >
        <Card.Content style={styles.messageContent}>
          <Paragraph
            style={[
              styles.messageText,
              { color: msg.sender === 'user' ? '#fff' : theme.colors.onSurface },
            ]}
          >
            {msg.text}
          </Paragraph>
          <Paragraph
            style={[
              styles.timestamp,
              { color: msg.sender === 'user' ? '#fff' : theme.colors.onSurface },
            ]}
          >
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Paragraph>
        </Card.Content>
      </Card>
      {msg.sender === 'user' && (
        <Avatar.Icon
          size={32}
          icon="account"
          style={[styles.avatar, { backgroundColor: theme.colors.secondary }]}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Aria - AI Assistant" 
        subtitle="Your personal finance advisor"
      />
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          
          {loading && (
            <View style={[styles.messageContainer, styles.botMessage]}>
              <Avatar.Icon
                size={32}
                icon="robot"
                style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
              />
              <Card style={[styles.messageCard, styles.botCard]}>
                <Card.Content style={styles.messageContent}>
                  <Paragraph style={styles.messageText}>
                    Thinking...
                  </Paragraph>
                </Card.Content>
              </Card>
            </View>
          )}
        </ScrollView>

        {/* Suggestions */}
        {suggestions.length > 0 && messages.length <= 1 && (
          <View style={styles.suggestionsContainer}>
            <Title style={styles.suggestionsTitle}>Suggestions:</Title>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsContent}
            >
              {suggestions.map((suggestion, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  onPress={() => sendMessage(suggestion)}
                  style={styles.suggestionChip}
                >
                  {suggestion}
                </Chip>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder="Ask me about your finances..."
            value={message}
            onChangeText={setMessage}
            multiline
            style={styles.textInput}
            right={
              <TextInput.Icon
                icon="send"
                onPress={() => sendMessage()}
                disabled={!message.trim() || loading}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
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
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  messageCard: {
    maxWidth: '75%',
    marginHorizontal: 8,
  },
  userCard: {
    backgroundColor: '#2196F3',
  },
  botCard: {
    backgroundColor: '#fff',
    elevation: 2,
  },
  messageContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  avatar: {
    alignSelf: 'flex-end',
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 4,
  },
  suggestionsTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  suggestionsContent: {
    paddingRight: 16,
  },
  suggestionChip: {
    marginRight: 8,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 8,
  },
  textInput: {
    fontSize: 16,
    maxHeight: 100,
  },
});

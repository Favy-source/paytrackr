import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Divider,
  Chip,
  Avatar,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import Header from '../components/Header';

export default function ReferralScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [referralData, setReferralData] = useState({
    referralCode: user?.referralCode || '',
    points: user?.points || 0,
    stats: {
      totalReferred: 0,
      totalPointsEarned: 0,
      lastReferralDate: null,
    },
    referredUsers: [],
    referredBy: null,
  });

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getReferralStats();
      
      if (response.status === 'success') {
        setReferralData(response.data);
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      Alert.alert('Error', 'Failed to load referral statistics');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReferralStats();
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!referralData.referralCode) {
      Alert.alert('Error', 'Unable to get referral code');
      return;
    }

    try {
      const referralMessage = `Join PayTrackr and take control of your finances! Use my referral code: ${referralData.referralCode}\n\nDownload the app and start managing your bills, tracking expenses, and earning rewards!\n\nhttps://paytrackr.app/register?ref=${referralData.referralCode}`;
      
      await Share.share({
        message: referralMessage,
        title: 'Join PayTrackr - Personal Finance Manager',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Referrals & Rewards" 
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Referral Code Card */}
        <Card style={styles.codeCard}>
          <Card.Content>
            <View style={styles.codeHeader}>
              <Avatar.Icon
                size={48}
                icon="gift"
                style={styles.codeIcon}
              />
              <View style={styles.codeInfo}>
                <Title style={styles.codeTitle}>Your Referral Code</Title>
                <Paragraph style={styles.codeSubtitle}>
                  Share this code with friends
                </Paragraph>
              </View>
            </View>
            
            <View style={styles.codeContainer}>
              <Chip
                mode="flat"
                style={styles.codeChip}
                textStyle={styles.codeText}
              >
                {referralData.referralCode}
              </Chip>
            </View>

            <Button
              mode="contained"
              onPress={handleShare}
              style={styles.shareButton}
              icon="share"
            >
              Share Code
            </Button>
          </Card.Content>
        </Card>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.statsTitle}>Your Statistics</Title>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="star-circle" size={32} color="#FFD700" />
                <Title style={styles.statNumber}>{referralData.points}</Title>
                <Paragraph style={styles.statLabel}>Total Points</Paragraph>
              </View>
              
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="account-group" size={32} color="#4CAF50" />
                <Title style={styles.statNumber}>{referralData.stats.totalReferred}</Title>
                <Paragraph style={styles.statLabel}>Friends Referred</Paragraph>
              </View>
            </View>

            {referralData.stats.lastReferralDate && (
              <View style={styles.lastReferralContainer}>
                <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
                <Paragraph style={styles.lastReferralText}>
                  Last referral: {formatDate(referralData.stats.lastReferralDate)}
                </Paragraph>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Referred By Card */}
        {referralData.referredBy && (
          <Card style={styles.referredByCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>You were referred by</Title>
              <List.Item
                title={referralData.referredBy.name}
                description={referralData.referredBy.email}
                left={(props) => <Avatar.Icon {...props} icon="account" size={40} />}
              />
            </Card.Content>
          </Card>
        )}

        {/* Referred Users */}
        {referralData.referredUsers.length > 0 && (
          <Card style={styles.referredUsersCard}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Friends You've Referred</Title>
              {referralData.referredUsers.map((user, index) => (
                <View key={user._id || index}>
                  <List.Item
                    title={user.name}
                    description={`Joined ${formatDate(user.createdAt)}`}
                    left={(props) => <Avatar.Icon {...props} icon="account-plus" size={40} />}
                    right={(props) => (
                      <Chip mode="outlined" compact>
                        +100 pts
                      </Chip>
                    )}
                  />
                  {index < referralData.referredUsers.length - 1 && <Divider />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* How it Works */}
        <Card style={styles.howItWorksCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>How It Works</Title>
            
            <View style={styles.stepContainer}>
              <View style={styles.step}>
                <Avatar.Text size={32} label="1" style={styles.stepNumber} />
                <View style={styles.stepContent}>
                  <Paragraph style={styles.stepTitle}>Share Your Code</Paragraph>
                  <Paragraph style={styles.stepText}>
                    Send your unique referral code to friends and family
                  </Paragraph>
                </View>
              </View>

              <View style={styles.step}>
                <Avatar.Text size={32} label="2" style={styles.stepNumber} />
                <View style={styles.stepContent}>
                  <Paragraph style={styles.stepTitle}>Friend Signs Up</Paragraph>
                  <Paragraph style={styles.stepText}>
                    They register using your referral code
                  </Paragraph>
                </View>
              </View>

              <View style={styles.step}>
                <Avatar.Text size={32} label="3" style={styles.stepNumber} />
                <View style={styles.stepContent}>
                  <Paragraph style={styles.stepTitle}>Earn Points</Paragraph>
                  <Paragraph style={styles.stepText}>
                    You both earn 100 points! Use points for rewards and discounts
                  </Paragraph>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
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
    paddingHorizontal: 16,
  },
  codeCard: {
    marginVertical: 8,
    backgroundColor: '#E8F5E8',
    elevation: 4,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  codeIcon: {
    backgroundColor: '#4CAF50',
    marginRight: 16,
  },
  codeInfo: {
    flex: 1,
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
  },
  codeSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  codeChip: {
    backgroundColor: '#C8E6C9',
  },
  codeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  shareButton: {
    backgroundColor: '#2E7D32',
  },
  statsCard: {
    marginVertical: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  lastReferralContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    justifyContent: 'center',
  },
  lastReferralText: {
    marginLeft: 8,
    fontSize: 12,
    opacity: 0.7,
  },
  referredByCard: {
    marginVertical: 8,
    elevation: 4,
  },
  referredUsersCard: {
    marginVertical: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  howItWorksCard: {
    marginVertical: 8,
    marginBottom: 32,
    elevation: 4,
  },
  stepContainer: {
    marginTop: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    backgroundColor: '#2196F3',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

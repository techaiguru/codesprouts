import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../../contexts/AuthContext';
import { LessonsService } from '../../services/lessons';
import { Card, Loading, ErrorMessage } from '../../components/UI';
import { theme } from '../../config/theme';
import { MainTabParamList, RootStackParamList, UserStats } from '../../types';

type DashboardScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  StackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

export default function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserStats = async () => {
    if (!user) return;

    try {
      setError(null);
      const result = await LessonsService.getUserStats(user.id);
      
      if (result.success) {
        setUserStats(result.data!);
      } else {
        setError(result.error || 'Failed to load user statistics');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserStats();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserStats();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getDisplayName = () => {
    if (user?.profile?.first_name) {
      return user.profile.first_name;
    }
    return user?.email?.split('@')[0] || 'Student';
  };

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{getDisplayName()}!</Text>
          {userStats && (
            <Text style={styles.streakText}>
              🔥 {userStats.streakDays} day streak
            </Text>
          )}
        </View>

        {/* Progress Overview */}
        {userStats && (
          <Card style={styles.progressCard} gradient>
            <View style={styles.progressContent}>
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>{userStats.level}</Text>
                <Text style={styles.progressLabel}>Level</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>{userStats.totalXP}</Text>
                <Text style={styles.progressLabel}>Total XP</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>{userStats.completedLessons}</Text>
                <Text style={styles.progressLabel}>Completed</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>{userStats.badgesEarned}</Text>
                <Text style={styles.progressLabel}>Badges</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Main Action Cards */}
        <View style={styles.actionCards}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Domains')}
          >
            <Card style={styles.cardContent}>
              <View style={styles.cardIcon}>
                <Ionicons name="globe" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Register .ke Domain</Text>
              <Text style={styles.cardDescription}>
                Find and register your perfect .ke domain for your portfolio or business
              </Text>
              <View style={styles.cardArrow}>
                <Ionicons name="arrow-forward" size={20} color={theme.colors.text.secondary} />
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Lessons')}
          >
            <Card style={styles.cardContent}>
              <View style={styles.cardIcon}>
                <Ionicons name="book" size={32} color={theme.colors.secondary} />
              </View>
              <Text style={styles.cardTitle}>Browse Lessons</Text>
              <Text style={styles.cardDescription}>
                Continue your learning journey with our comprehensive coding lessons
              </Text>
              <View style={styles.cardArrow}>
                <Ionicons name="arrow-forward" size={20} color={theme.colors.text.secondary} />
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Recent Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          {userStats && userStats.completedLessons > 0 ? (
            <Card style={styles.achievementCard}>
              <View style={styles.achievement}>
                <View style={styles.achievementIcon}>
                  <Ionicons name="trophy" size={24} color={theme.colors.warning} />
                </View>
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementTitle}>Lesson Master</Text>
                  <Text style={styles.achievementDescription}>
                    Completed {userStats.completedLessons} coding lessons
                  </Text>
                </View>
              </View>
            </Card>
          ) : (
            <Card style={styles.achievementCard}>
              <View style={styles.emptyAchievements}>
                <Ionicons name="star-outline" size={48} color={theme.colors.text.light} />
                <Text style={styles.emptyTitle}>Start Learning</Text>
                <Text style={styles.emptyDescription}>
                  Complete your first lesson to earn achievements
                </Text>
              </View>
            </Card>
          )}
        </View>

        {error && (
          <ErrorMessage message={error} onRetry={loadUserStats} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.secondary,
  },
  userName: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  streakText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  progressCard: {
    marginBottom: theme.spacing.xl,
  },
  progressContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.white,
    marginBottom: theme.spacing.xs,
  },
  progressLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.white,
    opacity: 0.8,
  },
  actionCards: {
    marginBottom: theme.spacing.xl,
  },
  actionCard: {
    marginBottom: theme.spacing.lg,
  },
  cardContent: {
    position: 'relative',
  },
  cardIcon: {
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  cardDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  cardArrow: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  achievementsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  achievementCard: {
    marginBottom: theme.spacing.md,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    marginRight: theme.spacing.md,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  achievementDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  emptyAchievements: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

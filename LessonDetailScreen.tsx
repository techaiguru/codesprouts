import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { LessonsService } from '../../services/lessons';
import { Card, Button, Loading, ErrorMessage } from '../../components/UI';
import { theme } from '../../config/theme';
import { Lesson, UserProgress, LessonsStackParamList } from '../../types';

type LessonDetailScreenNavigationProp = StackNavigationProp<LessonsStackParamList, 'LessonDetail'>;
type LessonDetailScreenRouteProp = RouteProp<LessonsStackParamList, 'LessonDetail'>;

interface Props {
  navigation: LessonDetailScreenNavigationProp;
  route: LessonDetailScreenRouteProp;
}

export default function LessonDetailScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { lessonId } = route.params;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadLessonData = async () => {
    if (!user) return;

    try {
      setError(null);
      
      // Fetch lesson details
      const lessonResult = await LessonsService.getLesson(lessonId);
      
      if (lessonResult.success && lessonResult.data) {
        setLesson(lessonResult.data);
        
        // Fetch user progress
        const progressResult = await LessonsService.getUserProgress(user.id, lessonId);
        if (progressResult.success) {
          setProgress(progressResult.data);
        }
      } else {
        setError(lessonResult.error || 'Failed to load lesson');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessonData();
  }, [user, lessonId]);

  const handleStartLesson = async () => {
    if (!user || !lesson) return;

    setUpdating(true);
    try {
      const result = await LessonsService.updateProgress(user.id, lesson.id, 10);
      if (result.success) {
        setProgress(result.data!);
        Alert.alert('Lesson Started', 'You have started this lesson. Good luck!');
      } else {
        Alert.alert('Error', result.error || 'Failed to start lesson');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const handleContinueLesson = async () => {
    if (!user || !lesson || !progress) return;

    setUpdating(true);
    try {
      const newProgress = Math.min(progress.progress + 20, 100);
      const result = await LessonsService.updateProgress(user.id, lesson.id, newProgress);
      if (result.success) {
        setProgress(result.data!);
        if (newProgress >= 100) {
          Alert.alert(
            'Congratulations!', 
            `You completed this lesson and earned ${lesson.xp_reward} XP!`
          );
        } else {
          Alert.alert('Progress Updated', `Lesson progress: ${Math.round(newProgress)}%`);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to update progress');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!user || !lesson) return;

    Alert.alert(
      'Complete Lesson',
      'Are you sure you want to mark this lesson as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setUpdating(true);
            try {
              const result = await LessonsService.completeLesson(user.id, lesson.id);
              if (result.success) {
                setProgress(result.data!);
                Alert.alert(
                  'Congratulations!', 
                  `You completed this lesson and earned ${lesson.xp_reward} XP!`
                );
              } else {
                Alert.alert('Error', result.error || 'Failed to complete lesson');
              }
            } catch (err) {
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return theme.colors.success;
      case 'intermediate':
        return theme.colors.warning;
      case 'advanced':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const getAuthorName = (lesson: Lesson) => {
    if (lesson.profiles?.first_name || lesson.profiles?.last_name) {
      return `${lesson.profiles.first_name || ''} ${lesson.profiles.last_name || ''}`.trim();
    }
    return 'CodeSprouts';
  };

  const getActionButton = () => {
    if (!progress) {
      return (
        <Button
          title="Start Lesson"
          onPress={handleStartLesson}
          loading={updating}
          style={styles.actionButton}
        />
      );
    }

    if (progress.completed) {
      return (
        <View style={styles.completedContainer}>
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
          <Text style={styles.completedText}>Lesson Completed!</Text>
        </View>
      );
    }

    return (
      <View style={styles.actionsContainer}>
        <Button
          title="Continue Learning"
          onPress={handleContinueLesson}
          loading={updating}
          style={[styles.actionButton, { flex: 1, marginRight: theme.spacing.sm }]}
        />
        <Button
          title="Complete"
          onPress={handleCompleteLesson}
          loading={updating}
          variant="secondary"
          style={[styles.actionButton, { flex: 1 }]}
        />
      </View>
    );
  };

  if (loading) {
    return <Loading text="Loading lesson..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadLessonData} />;
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>Lesson not found</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lesson Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Lesson Header */}
        <Card style={styles.lessonHeader}>
          <View style={styles.lessonMeta}>
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(lesson.difficulty) }
            ]}>
              <Text style={styles.difficultyText}>{lesson.difficulty}</Text>
            </View>
            <Text style={styles.xpReward}>+{lesson.xp_reward} XP</Text>
          </View>
          
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          
          {lesson.description && (
            <Text style={styles.lessonDescription}>
              {lesson.description}
            </Text>
          )}

          <View style={styles.lessonInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="folder-outline" size={18} color={theme.colors.text.secondary} />
              <Text style={styles.infoText}>{lesson.category}</Text>
            </View>
            
            {lesson.duration && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color={theme.colors.text.secondary} />
                <Text style={styles.infoText}>{lesson.duration}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color={theme.colors.text.secondary} />
              <Text style={styles.infoText}>{getAuthorName(lesson)}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          {progress && (
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Your Progress</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${progress.progress}%`,
                        backgroundColor: progress.completed ? theme.colors.success : theme.colors.primary
                      }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(progress.progress)}%</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Lesson Content */}
        <Card style={styles.contentCard}>
          <Text style={styles.contentTitle}>Lesson Content</Text>
          {lesson.content ? (
            <Text style={styles.contentText}>{lesson.content}</Text>
          ) : (
            <Text style={styles.placeholderText}>
              This lesson content will be available soon. The lesson structure is ready 
              and you can track your progress, but the detailed content is being prepared.
            </Text>
          )}
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {getActionButton()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  backButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  lessonHeader: {
    margin: theme.spacing.lg,
  },
  lessonMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  difficultyBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  difficultyText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.white,
    textTransform: 'uppercase',
  },
  xpReward: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  lessonTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    lineHeight: 32,
  },
  lessonDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 24,
  },
  lessonInfo: {
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  progressSection: {
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  progressLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    minWidth: 50,
  },
  contentCard: {
    margin: theme.spacing.lg,
    marginTop: 0,
  },
  contentTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  contentText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  placeholderText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  actionSection: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  actionButton: {
    marginBottom: theme.spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.success + '20',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  completedText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.success,
    marginLeft: theme.spacing.sm,
  },
});

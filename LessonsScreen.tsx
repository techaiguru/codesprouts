import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { LessonsService } from '../../services/lessons';
import { Card, Loading, ErrorMessage, EmptyState } from '../../components/UI';
import { theme } from '../../config/theme';
import { Lesson, UserProgress, LessonFilter, LessonsStackParamList } from '../../types';

type LessonsScreenNavigationProp = StackNavigationProp<LessonsStackParamList, 'LessonsList'>;

interface Props {
  navigation: LessonsScreenNavigationProp;
}

export default function LessonsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [userProgress, setUserProgress] = useState<{ [key: string]: UserProgress }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const loadLessons = async () => {
    if (!user) return;

    try {
      setError(null);
      
      // Build filter
      const filter: LessonFilter = {};
      if (selectedCategory) filter.category = selectedCategory;
      if (selectedDifficulty) filter.difficulty = selectedDifficulty;

      // Fetch lessons
      const lessonsResult = await LessonsService.fetchLessons(filter);
      
      if (lessonsResult.success) {
        setLessons(lessonsResult.data || []);
        
        // Fetch user progress for all lessons
        const progressResult = await LessonsService.getAllUserProgress(user.id);
        if (progressResult.success) {
          const progressMap: { [key: string]: UserProgress } = {};
          (progressResult.data || []).forEach(p => {
            progressMap[p.lesson_id] = p;
          });
          setUserProgress(progressMap);
        }
      } else {
        setError(lessonsResult.error || 'Failed to load lessons');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesResult = await LessonsService.getCategories();
      if (categoriesResult.success) {
        setCategories(categoriesResult.data || []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  useEffect(() => {
    loadLessons();
    loadCategories();
  }, [user, selectedCategory, selectedDifficulty]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLessons();
    setRefreshing(false);
  };

  const handleLessonPress = (lesson: Lesson) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to access lessons.');
      return;
    }
    navigation.navigate('LessonDetail', { lessonId: lesson.id });
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

  const renderLessonCard = ({ item: lesson }: { item: Lesson }) => {
    const progress = userProgress[lesson.id];
    const progressPercentage = progress ? progress.progress : 0;
    const isCompleted = progress?.completed || false;

    return (
      <TouchableOpacity onPress={() => handleLessonPress(lesson)}>
        <Card style={styles.lessonCard}>
          <View style={styles.lessonHeader}>
            <View style={styles.lessonMeta}>
              <View style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(lesson.difficulty) }
              ]}>
                <Text style={styles.difficultyText}>{lesson.difficulty}</Text>
              </View>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                </View>
              )}
            </View>
            <Text style={styles.xpReward}>+{lesson.xp_reward} XP</Text>
          </View>

          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          
          {lesson.description && (
            <Text style={styles.lessonDescription} numberOfLines={2}>
              {lesson.description}
            </Text>
          )}

          <View style={styles.lessonDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="folder-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={styles.detailText}>{lesson.category}</Text>
            </View>
            
            {lesson.duration && (
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.detailText}>{lesson.duration}</Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={styles.detailText}>{getAuthorName(lesson)}</Text>
            </View>
          </View>

          {progressPercentage > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: isCompleted ? theme.colors.success : theme.colors.primary
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Coding Lessons</Text>
        <Text style={styles.subtitle}>
          Master programming skills with our comprehensive lessons
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Categories</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ name: 'All', value: null }, ...categories.map(c => ({ name: c, value: c }))]}
          keyExtractor={(item) => item.value || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCategory === item.value && styles.filterChipActive
              ]}
              onPress={() => setSelectedCategory(item.value)}
            >
              <Text style={[
                styles.filterChipText,
                selectedCategory === item.value && styles.filterChipTextActive
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filtersContent}
        />
      </View>
    </View>
  );

  if (loading) {
    return <Loading text="Loading lessons..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {error ? (
        <ErrorMessage message={error} onRetry={loadLessons} />
      ) : (
        <FlatList
          data={lessons}
          renderItem={renderLessonCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <EmptyState
              title="No Lessons Found"
              message={"We couldn't find any lessons matching your criteria. Try adjusting your filters or check back later."}
              actionText="Refresh"
              onAction={loadLessons}
            />
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  listContent: {
    flexGrow: 1,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  filtersContainer: {
    marginBottom: theme.spacing.md,
  },
  filtersTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[200],
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.medium,
  },
  filterChipTextActive: {
    color: theme.colors.text.white,
  },
  lessonCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  difficultyText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.white,
    textTransform: 'uppercase',
  },
  completedBadge: {
    marginLeft: theme.spacing.sm,
  },
  xpReward: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  lessonTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    lineHeight: 24,
  },
  lessonDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  lessonDetails: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  progressText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
    minWidth: 40,
  },
});

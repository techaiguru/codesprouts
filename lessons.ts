import { supabase } from '../config/supabase';
import { Lesson, UserProgress, LessonFilter, UserStats, ApiResponse } from '../types';

export class LessonsService {
  // Fetch all published lessons
  static async fetchLessons(filter?: LessonFilter): Promise<ApiResponse<Lesson[]>> {
    try {
      // Try with author join first
      let query = supabase
        .from('lessons')
        .select(`
          *,
          profiles!lessons_author_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter?.category) {
        query = query.eq('category', filter.category);
      }
      if (filter?.difficulty) {
        query = query.eq('difficulty', filter.difficulty);
      }

      let { data, error } = await query;

      // If join fails, try without author information
      if (error) {
        console.log('Trying lessons query without author join...');
        let simpleQuery = supabase
          .from('lessons')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        // Apply filters
        if (filter?.category) {
          simpleQuery = simpleQuery.eq('category', filter.category);
        }
        if (filter?.difficulty) {
          simpleQuery = simpleQuery.eq('difficulty', filter.difficulty);
        }

        const simpleResult = await simpleQuery;
        data = simpleResult.data;
        error = simpleResult.error;
      }

      if (error) {
        console.error('Error fetching lessons:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: (data || []) as Lesson[],
      };
    } catch (error) {
      console.error('Error fetching lessons:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch lessons',
      };
    }
  }

  // Get single lesson by ID
  static async getLesson(lessonId: string): Promise<ApiResponse<Lesson | null>> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as Lesson,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch lesson',
      };
    }
  }

  // Get user progress for a specific lesson
  static async getUserProgress(userId: string, lessonId: string): Promise<ApiResponse<UserProgress | null>> {
    try {
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as UserProgress || null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user progress',
      };
    }
  }

  // Get all user progress
  static async getAllUserProgress(userId: string): Promise<ApiResponse<UserProgress[]>> {
    try {
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as UserProgress[],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user progress',
      };
    }
  }

  // Update user progress for a lesson
  static async updateProgress(userId: string, lessonId: string, progress: number): Promise<ApiResponse<UserProgress>> {
    try {
      // Check if progress record exists
      const existingProgress = await this.getUserProgress(userId, lessonId);
      
      const progressData = {
        user_id: userId,
        lesson_id: lessonId,
        progress: Math.min(Math.max(progress, 0), 100), // Clamp between 0-100
        completed: progress >= 100,
        completed_at: progress >= 100 ? new Date().toISOString() : null,
      };

      let result;
      if (existingProgress.data) {
        // Update existing progress
        const { data, error } = await supabase
          .from('user_lesson_progress')
          .update(progressData)
          .eq('user_id', userId)
          .eq('lesson_id', lessonId)
          .select()
          .single();
        
        result = { data, error };
      } else {
        // Create new progress record
        const { data, error } = await supabase
          .from('user_lesson_progress')
          .insert([progressData])
          .select()
          .single();
        
        result = { data, error };
      }

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        };
      }

      return {
        success: true,
        data: result.data as UserProgress,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update progress',
      };
    }
  }

  // Mark lesson as completed and award XP
  static async completeLesson(userId: string, lessonId: string): Promise<ApiResponse<UserProgress>> {
    try {
      // Get the lesson to know XP reward
      const lessonResult = await this.getLesson(lessonId);
      if (!lessonResult.success || !lessonResult.data) {
        return {
          success: false,
          error: 'Lesson not found',
        };
      }

      // Update progress to 100%
      const progressResult = await this.updateProgress(userId, lessonId, 100);
      
      if (!progressResult.success) {
        return progressResult;
      }

      // TODO: Award XP to user profile (would need to add XP field to profiles table)
      // For now, we just return the progress update

      return progressResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete lesson',
      };
    }
  }

  // Get user statistics
  static async getUserStats(userId: string): Promise<ApiResponse<UserStats>> {
    try {
      // Get all user progress
      const progressResult = await this.getAllUserProgress(userId);
      if (!progressResult.success) {
        return {
          success: false,
          error: progressResult.error || 'Failed to fetch user stats',
        };
      }

      const allProgress = progressResult.data || [];
      const completedLessons = allProgress.filter(p => p.completed).length;
      
      // Calculate total XP (would need to join with lessons table in a real implementation)
      // For now, assume 50 XP per completed lesson
      const totalXP = completedLessons * 50;
      
      // Calculate level (every 200 XP = 1 level)
      const level = Math.floor(totalXP / 200) + 1;

      // TODO: Calculate streak and badges from actual data
      const stats: UserStats = {
        totalXP,
        level,
        completedLessons,
        streakDays: 0, // Would need streak tracking
        badgesEarned: Math.floor(completedLessons / 5), // 1 badge per 5 lessons
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate user stats',
      };
    }
  }

  // Get lesson categories (for filtering)
  static async getCategories(): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('category')
        .eq('status', 'published');

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Get unique categories
      const categories = [...new Set(data.map(item => item.category))];

      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
      };
    }
  }

  // Get difficulty levels (for filtering)
  static async getDifficultyLevels(): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('difficulty')
        .eq('status', 'published');

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Get unique difficulty levels
      const difficulties = [...new Set(data.map(item => item.difficulty))];

      return {
        success: true,
        data: difficulties,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch difficulty levels',
      };
    }
  }
}

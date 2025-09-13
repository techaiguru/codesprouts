import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser, Profile, SignUpForm, LoginForm, ApiResponse } from '../types';

export class AuthService {
  // Sign in with email and password
  static async signIn(credentials: LoginForm): Promise<ApiResponse<AuthUser>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Authentication failed',
        };
      }

      // Get user profile
      const profile = await this.getProfile(data.user.id);
      
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        profile: profile.data,
      };

      return {
        success: true,
        data: authUser,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  // Sign up with email, password, and profile data
  static async signUp(formData: SignUpForm): Promise<ApiResponse<AuthUser>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'student',
            organization: formData.organization,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Registration failed',
        };
      }

      // Create profile in database
      const profileResult = await this.createProfile({
        id: data.user.id,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: 'student',
        organization: formData.organization,
      });

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        profile: profileResult.data,
      };

      return {
        success: true,
        data: authUser,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  // Sign out
  static async signOut(): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Clear any cached data
      await AsyncStorage.clear();

      return {
        success: true,
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<ApiResponse<AuthUser | null>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          success: true,
          data: null,
        };
      }

      // Get user profile
      const profile = await this.getProfile(user.id);
      
      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        profile: profile.data,
      };

      return {
        success: true,
        data: authUser,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current user',
        data: null,
      };
    }
  }

  // Get user profile
  static async getProfile(userId: string): Promise<ApiResponse<Profile | null>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as Profile,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
      };
    }
  }

  // Create user profile
  static async createProfile(profile: Profile): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profile])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as Profile,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create profile',
      };
    }
  }

  // Update user profile
  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as Profile,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      };
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await this.getProfile(session.user.id);
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          profile: profile.data,
        };
        callback(authUser);
      } else {
        callback(null);
      }
    });
  }
}

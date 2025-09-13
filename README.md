# CodeSprouts - React Native Mobile App

A comprehensive React Native mobile app built with Expo for learning coding and registering .ke domains.

Access the mobile app build using the following link: https://expo.dev/accounts/techaiguru/projects/CodeSprouts/builds/25a941e4-afa6-4d98-9d57-f09265f07aee

## 🚀 Features

### Authentication
- **Student Registration**: Email/password signup for learners only
- **Secure Login**: Email/password authentication with Supabase
- **Session Management**: Automatic login persistence with AsyncStorage
- **Profile Management**: User profiles with name, organization, and role

### Dashboard
- **Personalized Welcome**: Time-based greetings with user's name
- **Progress Overview**: Level, XP, completed lessons, and badges display
- **Quick Actions**: Direct access to domain registration and lessons
- **Achievement System**: Track learning progress and milestones

### Domain Registration (.ke)
- **Domain Search**: Search for available .ke domain extensions
- **Multiple Extensions**: Support for .co.ke, .me.ke, .ke, .or.ke, .ac.ke
- **WHOIS Integration**: Real-time domain availability checking
- **KENIC Registrars**: Complete list of 20+ official registrars
- **Contact Integration**: Direct phone/email contact with registrars
- **Smart Suggestions**: Popular domain name suggestions

### Learning Platform
- **Lesson Management**: Browse and track coding lessons
- **Progress Tracking**: Individual lesson progress with XP rewards
- **Category Filtering**: Filter lessons by category and difficulty
- **Achievement System**: Badges and levels based on completion

### User Profile
- **Statistics Dashboard**: Comprehensive learning stats
- **Account Management**: View and manage user information
- **Settings**: App preferences and configuration
- **Secure Logout**: Complete session cleanup

## 🛠 Technical Stack

### Frontend
- **React Native**: Cross-platform mobile development
- **Expo**: Development and deployment platform
- **TypeScript**: Type-safe JavaScript development
- **React Navigation**: Screen navigation and routing

### Backend Integration
- **Supabase**: Backend-as-a-Service
- **Authentication**: Supabase Auth with email/password
- **Database**: PostgreSQL via Supabase
- **Edge Functions**: WHOIS domain lookup functionality

### UI/UX
- **Expo Linear Gradient**: Beautiful gradient backgrounds
- **Expo Vector Icons**: Comprehensive icon library
- **Custom Components**: Reusable UI component library
- **Responsive Design**: Optimized for different screen sizes

### State Management
- **Context API**: Global authentication state
- **Local State**: Component-level state management
- **AsyncStorage**: Local data persistence

## 📱 App Structure

```
src/
├── components/
│   └── UI.tsx                 # Reusable UI components
├── config/
│   ├── supabase.ts           # Supabase client configuration
│   ├── theme.ts              # App theme and styling
│   └── registrars.ts         # KENIC registrar data
├── contexts/
│   └── AuthContext.tsx       # Authentication context
├── navigation/
│   └── AppNavigator.tsx      # Navigation configuration
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx   # User login
│   │   └── SignUpScreen.tsx  # User registration
│   └── main/
│       ├── DashboardScreen.tsx    # Main dashboard
│       ├── DomainsScreen.tsx      # Domain search
│       ├── LessonsScreen.tsx      # Lessons list
│       ├── LessonDetailScreen.tsx # Individual lesson
│       └── ProfileScreen.tsx      # User profile
├── services/
│   ├── auth.ts               # Authentication services
│   ├── lessons.ts            # Lesson management
│   └── domains.ts            # Domain lookup services
├── types/
│   └── index.ts              # TypeScript type definitions
└── utils/                    # Utility functions
```

## 📊 Features Implementation

### Domain Search
- Input validation for domain names
- Real-time WHOIS lookup via Edge Functions
- Display of 20+ KENIC registrars
- Pagination for registrar listings
- Direct contact integration (phone/email)

### Learning Platform
- Lesson categorization and filtering
- Progress tracking with percentages
- XP system for gamification
- Level calculation based on total XP
- Badge system for achievements

### User Experience
- Smooth animations and transitions
- Pull-to-refresh functionality
- Offline support for cached data
- Error boundaries and retry mechanisms
- Loading states for all async operations

## 🔐 Security Features

- **Authentication**: Secure email/password with Supabase Auth
- **Session Management**: Automatic token refresh and validation
- **Data Validation**: Input sanitization and validation
- **Error Handling**: No sensitive data exposure in error messages
- **Role-Based Access**: Student-only registration enforcement

## 🚀 Future Enhancements

### Planned Features
- **Offline Mode**: Full offline functionality with sync
- **Push Notifications**: Lesson reminders and updates
- **Social Features**: Community forums and discussions
- **Advanced Analytics**: Detailed learning analytics
- **Dark Mode**: Theme switching capability
- **Multi-language**: Internationalization support

### Performance Optimizations
- **Lazy Loading**: Component and route-level code splitting
- **Image Optimization**: Cached and compressed images
- **Bundle Size**: Tree shaking and unused code elimination
- **Memory Management**: Proper cleanup and garbage collection

## 📱 Device Compatibility

- **iOS**
- **Android**

**CodeSprouts** - Building the future of mobile learning and domain management in Kenya 🇰🇪

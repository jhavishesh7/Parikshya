# NEB Exam Platform - AI-Powered Adaptive Testing

A comprehensive, AI-powered adaptive testing platform specifically designed for Nepal's NEB-based entrance examinations (IOE Engineering and CEE Medical).

## 🚀 Features

### Core Functionality
- **Adaptive Testing**: Gemini AI-powered question selection based on user performance
- **Exam-Specific Content**: IOE (Engineering) and CEE (Medical) with appropriate subjects
- **Real-time Analytics**: Comprehensive performance tracking and personalized insights
- **AI Assistant**: 24/7 chatbot for study guidance and question explanations
- **Notes Management**: PDF upload and categorization system
- **Admin Dashboard**: Complete CRUD operations with CSV/PDF upload capabilities

### AI-Powered Features
- **Personalized Learning**: AI adapts to individual learning patterns
- **Intelligent Question Selection**: Based on difficulty, topic coverage, and ability estimation
- **Performance Analysis**: Detailed reports on strengths, weaknesses, and improvement areas
- **Automated Explanations**: AI-generated explanations for every question

### Technical Features
- **Modern UI/UX**: Dark theme with smooth animations and responsive design
- **Real-time Updates**: Live progress tracking and instant feedback
- **Secure Authentication**: Supabase Auth with role-based access control
- **Scalable Architecture**: Built with React, TypeScript, and Supabase

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Zustand** for state management
- **React Router** for navigation

### Backend & Database
- **Supabase** (PostgreSQL, Auth, Storage, Real-time)
- **Row Level Security (RLS)** for data protection
- **Edge Functions** for business logic

### AI Integration
- **Google Gemini API** for adaptive testing and analytics
- **Natural Language Processing** for content analysis

## 📋 Prerequisites

1. Node.js 16+ and npm
2. Supabase account and project
3. Google Gemini API key

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd neb-exam-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase and Gemini API credentials.

4. **Set up Supabase**
   ```bash
   # Quick setup (recommended)
   npm run setup-supabase
   
   # Manual setup
   - Create a new Supabase project
   - Run the migration file in the SQL editor
   - Configure RLS policies
   - Set up storage bucket for PDFs
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📊 Database Schema

### Core Tables
- **profiles**: User information and AI ability tracking
- **subjects**: Physics, Chemistry, Biology, Mathematics, English
- **questions**: Question bank with difficulty levels and IRT parameters
- **test_sessions**: Exam sessions with AI analysis
- **responses**: Individual question responses
- **notes**: PDF study materials
- **analytics**: Performance metrics and insights
- **ai_interactions**: Chatbot conversation history

## 🎯 Exam Configuration

### IOE (Engineering)
- **Duration**: 2 hours (120 minutes)
- **Questions**: 100 MCQs
- **Subjects**: Physics (25), Chemistry (20), Mathematics (45), English (10)
- **Marking**: +4 for correct, -1 for wrong

### CEE (Medical)
- **Duration**: 3 hours (180 minutes)
- **Questions**: 200 MCQs
- **Subjects**: Physics (50), Chemistry (50), Biology (100)
- **Marking**: +1 for correct, -0.25 for wrong

## 🔐 Admin Features

### Question Management
- **CSV Upload**: Bulk question import with difficulty labels
- **CRUD Operations**: Create, read, update, delete questions
- **Subject Categorization**: Automatic subject and topic assignment
- **Difficulty Calibration**: AI-assisted difficulty adjustment

### Notes Management
- **PDF Upload**: Direct file upload to Supabase Storage
- **Categorization**: Subject, difficulty, and topic labeling
- **Access Control**: Download tracking and permissions

### Analytics Dashboard
- **User Performance**: Individual and aggregate statistics
- **Question Analytics**: Success rates and difficulty analysis
- **Platform Metrics**: Usage patterns and engagement data

## 🤖 AI Integration

### Adaptive Algorithm
1. **Initial Assessment**: Baseline ability estimation
2. **Dynamic Adjustment**: Real-time ability recalculation
3. **Question Selection**: Optimal difficulty matching
4. **Performance Prediction**: Success probability estimation

### Personalization Features
- **Learning Path Optimization**: AI-recommended study sequences
- **Weakness Identification**: Topic-specific performance analysis
- **Strength Recognition**: Areas of excellence highlighting
- **Study Recommendations**: Personalized improvement strategies

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Vercel (recommended)
   - Netlify
   - AWS S3 + CloudFront

3. **Configure environment variables** in your deployment platform

4. **Set up Supabase Edge Functions** (optional, for advanced features)

## 📈 Performance Optimization

- **Lazy Loading**: Route-based code splitting
- **Image Optimization**: Responsive images with lazy loading
- **Caching Strategy**: Supabase query caching
- **Bundle Size**: Tree shaking and dependency optimization

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **Role-based Access**: Student and admin role separation
- **Data Encryption**: Sensitive data protection
- **API Security**: Rate limiting and input validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Nepal Education Board (NEB) for examination specifications
- Google Gemini team for AI capabilities
- Supabase team for the backend infrastructure
- React and TypeScript communities for the frontend foundation

## 📞 Support

For support, email your-support@email.com or create an issue in the repository.
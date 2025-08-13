# Mock Test System - User Guide

## Overview

The Mock Test System has been completely redesigned to provide a better user experience. Instead of showing individual questions, users now see a list of available mock tests and can start specific ones.

## New Features

### 1. Mock Test Listing Page (`/mock-tests`)
- **Grid Layout**: Shows all available mock tests in an attractive card-based grid
- **Filtering**: Filter tests by subject (Physics, Chemistry, Biology, Mathematics, English)
- **Search**: Search tests by name, description, or subject
- **Test Information**: Each card shows:
  - Test name and description
  - Subject and exam type (IOE/CEE)
  - Duration and number of questions
  - Difficulty level with color coding
  - Passing score requirement
  - Instructions preview

### 2. Mock Test Taking Interface (`/mock-test/:testId`)
- **Instructions Screen**: Shows test details and instructions before starting
- **Timed Testing**: Configurable time limits per test
- **Question Navigator**: Visual navigation between questions
- **Progress Tracking**: Real-time progress bar and completion percentage
- **Results Analysis**: Detailed results with correct/incorrect answer breakdown

## How It Works

### For Students/Users:
1. Navigate to **Mock Tests** from the main navigation
2. Browse available tests by subject or search for specific tests
3. Click **"Start Test"** on any test you want to take
4. Review test instructions and details
5. Click **"Start Test"** to begin the timed exam
6. Answer questions using the question navigator
7. Submit when finished or when time runs out
8. View detailed results and performance analysis

### For Administrators:
1. Access the Admin Panel
2. Use **Mock Tests CRUD** to create and manage mock tests
3. Set test parameters:
   - Name and description
   - Subject and exam type
   - Duration and question count
   - Difficulty level
   - Instructions
   - Passing score
4. Add questions to tests using the **File Upload Form**
5. Set test status to "ready" when complete

## Database Structure

### Tables:
- **`mock_tests`**: Test metadata (name, description, duration, etc.)
- **`mock_questions`**: Links between tests and questions
- **`questions`**: Individual question content
- **`subjects`**: Subject categories

### Key Fields:
- `status`: Test availability (draft, processing, ready, failed)
- `difficulty_level`: easy, moderate, difficult
- `exam_type`: IOE, CEE
- `passing_score`: Percentage required to pass

## Sample Data

A sample data script (`sample_mock_tests.sql`) is provided with:
- 4 sample mock tests across different subjects
- Physics, Chemistry, Mathematics, and Biology tests
- Various difficulty levels and exam types
- Realistic instructions and parameters

## Routes

- `/mock-tests` - Main mock test listing page
- `/mock-test/:testId` - Individual test taking interface

## Technical Implementation

### Components:
- `MockTestPage.tsx` - Test listing and browsing
- `MockTestTakingPage.tsx` - Test taking interface
- `MockTestsCRUD.tsx` - Admin management interface

### Features:
- Responsive design with Tailwind CSS
- Framer Motion animations
- Real-time timer with auto-submit
- Question navigation with progress tracking
- Comprehensive results analysis
- Mobile-friendly interface

## Usage Examples

### Creating a Mock Test:
1. Admin creates test with basic info
2. Uploads questions or selects from existing question bank
3. Sets test parameters and instructions
4. Publishes test with "ready" status

### Taking a Mock Test:
1. User browses available tests
2. Selects test based on subject/difficulty
3. Reviews instructions and starts test
4. Answers questions within time limit
5. Submits and views results
6. Can retake or return to test list

## Benefits of New System

1. **Better Organization**: Tests are grouped and categorized
2. **Improved UX**: Clear test selection and instructions
3. **Flexible Timing**: Configurable time limits per test
4. **Progress Tracking**: Visual progress indicators
5. **Detailed Results**: Comprehensive performance analysis
6. **Admin Control**: Easy test management and customization

## Future Enhancements

- Test history and performance tracking
- Adaptive difficulty based on user performance
- Question randomization and shuffling
- Export results and certificates
- Integration with learning analytics
- Mobile app support

## Troubleshooting

### Common Issues:
1. **No tests showing**: Check if tests have "ready" status
2. **Questions not loading**: Verify mock_questions table has data
3. **Navigation errors**: Ensure routes are properly configured
4. **Timer issues**: Check browser compatibility and JavaScript errors

### Database Issues:
- Run the sample data script to populate test data
- Verify table structure matches migrations
- Check RLS policies for proper access control

## Support

For technical issues or questions about the mock test system, refer to:
- Database migrations in `supabase/migrations/`
- Component source code in `src/pages/` and `src/admin/`
- Sample data scripts for testing
- Admin panel for test management

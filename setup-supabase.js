#!/usr/bin/env node

/**
 * Supabase Quick Setup Script
 * This script helps you set up your Supabase project with required storage buckets and policies
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupSupabase() {
  console.log('🚀 Supabase Quick Setup for Admin Panel\n');
  
  // Get Supabase credentials
  const supabaseUrl = await question('Enter your Supabase URL (e.g., https://yourproject.supabase.co): ');
  const supabaseKey = await question('Enter your Supabase anon key: ');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Please provide both URL and key');
    rl.close();
    return;
  }
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('\n🔍 Checking connection...');
    
    // Test connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log('⚠️  Note: Using anon key (this is normal for setup)');
    }
    
    // Check existing buckets
    console.log('\n📦 Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Error accessing storage:', bucketsError.message);
      console.log('💡 Make sure your Supabase project is set up and the key is correct');
      rl.close();
      return;
    }
    
    const existingBuckets = buckets?.map(b => b.name) || [];
    console.log('✅ Found buckets:', existingBuckets.length > 0 ? existingBuckets.join(', ') : 'none');
    
    // Create required buckets
    const requiredBuckets = ['notes', 'avatars', 'question-images'];
    const bucketsToCreate = requiredBuckets.filter(name => !existingBuckets.includes(name));
    
    if (bucketsToCreate.length > 0) {
      console.log(`\n🔨 Creating missing buckets: ${bucketsToCreate.join(', ')}`);
      
      for (const bucketName of bucketsToCreate) {
        try {
          const { error } = await supabase.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: bucketName === 'notes' ? ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] : 
                           bucketName === 'avatars' ? ['image/jpeg', 'image/png', 'image/gif'] : 
                           ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
          });
          
          if (error) {
            console.log(`❌ Failed to create bucket "${bucketName}":`, error.message);
          } else {
            console.log(`✅ Created bucket "${bucketName}"`);
          }
        } catch (err) {
          console.log(`❌ Error creating bucket "${bucketName}":`, err.message);
        }
      }
    } else {
      console.log('✅ All required buckets already exist!');
    }
    
    // Create environment file
    console.log('\n📝 Creating .env.local file...');
    const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseKey}
`;
    
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Created .env.local file');
    
    // Create required database tables
    console.log('\n🗄️  Creating database tables...');
    
    try {
      // Create subjects table if it doesn't exist
      const { error: subjectsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS subjects (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            display_name TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (subjectsError) {
        console.log('⚠️  Subjects table creation:', subjectsError.message);
      } else {
        console.log('✅ Subjects table ready');
      }
      
      // Create questions table if it doesn't exist
      const { error: questionsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS questions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            question_text TEXT NOT NULL,
            options TEXT[] NOT NULL,
            correct_answer INTEGER NOT NULL,
            difficulty TEXT DEFAULT 'moderate',
            subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
            topic TEXT,
            explanation TEXT,
            exam_types TEXT[] DEFAULT ARRAY['IOE', 'CEE'],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (questionsError) {
        console.log('⚠️  Questions table creation:', questionsError.message);
      } else {
        console.log('✅ Questions table ready');
      }
      
      // Create mock_tests table if it doesn't exist
      const { error: mockTestsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS mock_tests (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
            exam_type TEXT DEFAULT 'IOE',
            duration_minutes INTEGER DEFAULT 60,
            total_questions INTEGER DEFAULT 0,
            difficulty_level TEXT DEFAULT 'moderate',
            instructions TEXT,
            passing_score INTEGER DEFAULT 60,
            status TEXT DEFAULT 'draft',
            pdf_path TEXT,
            created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (mockTestsError) {
        console.log('⚠️  Mock Tests table creation:', mockTestsError.message);
      } else {
        console.log('✅ Mock Tests table ready');
      }
      
      // Create mock_questions table if it doesn't exist
      const { error: mockQuestionsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS mock_questions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            mock_test_id UUID REFERENCES mock_tests(id) ON DELETE CASCADE,
            question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
            subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
            difficulty_level TEXT DEFAULT 'moderate',
            explanation TEXT,
            topic TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (mockQuestionsError) {
        console.log('⚠️  Mock Questions table creation:', mockQuestionsError.message);
      } else {
        console.log('✅ Mock Questions table ready');
      }
      
      // Create notes table if it doesn't exist
      const { error: notesError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS notes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
            exam_type TEXT DEFAULT 'IOE',
            file_size INTEGER DEFAULT 0,
            uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (notesError) {
        console.log('⚠️  Notes table creation:', notesError.message);
      } else {
        console.log('✅ Notes table ready');
      }
      
      // Create profiles table if it doesn't exist (for user management)
      const { error: profilesError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS profiles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            full_name TEXT,
            email TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (profilesError) {
        console.log('⚠️  Profiles table creation:', profilesError.message);
      } else {
        console.log('✅ Profiles table ready');
      }
      
    } catch (error) {
      console.log('⚠️  Database setup:', error.message);
      console.log('💡 Some tables may already exist or you may need to run migrations manually');
    }
    
    // Add some sample data
    console.log('\n📝 Adding sample data...');
    
    try {
      // Add sample subjects if they don't exist
      const { error: sampleSubjectsError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO subjects (display_name, description) 
          VALUES 
            ('Physics', 'Study of matter, energy, and their interactions'),
            ('Chemistry', 'Study of substances and their properties'),
            ('Mathematics', 'Study of numbers, quantities, and shapes')
          ON CONFLICT (display_name) DO NOTHING;
        `
      });
      
      if (sampleSubjectsError) {
        console.log('⚠️  Sample subjects:', sampleSubjectsError.message);
      } else {
        console.log('✅ Added sample subjects');
      }
      
    } catch (error) {
      console.log('⚠️  Sample data:', error.message);
    }
    
    console.log('\n🔧 Running database migrations...');
    try {
      // Run the mock test schema fix migration
      const { error: migrationError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Fix Mock Test Schema
          DO $$ 
          BEGIN
              -- Add status column if it doesn't exist
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                             WHERE table_name = 'mock_tests' AND column_name = 'status') THEN
                  ALTER TABLE mock_tests ADD COLUMN status text DEFAULT 'draft';
              END IF;

              -- Add pdf_path column if it doesn't exist
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                             WHERE table_name = 'mock_tests' AND column_name = 'pdf_path') THEN
                  ALTER TABLE mock_tests ADD COLUMN pdf_path text;
              END IF;

              -- Add subject_id column if it doesn't exist
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                             WHERE table_name = 'mock_questions' AND column_name = 'subject_id') THEN
                  ALTER TABLE mock_questions ADD COLUMN subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE;
              END IF;
          END $$;
        `
      });
      
      if (migrationError) {
        console.log('⚠️  Migration warning (this is normal if tables already exist):', migrationError.message);
      } else {
        console.log('✅ Database schema updated');
      }
    } catch (migrationErr) {
      console.log('⚠️  Migration note: You may need to run migrations manually in your Supabase dashboard');
    }
    
    console.log('\n🎉 Setup complete! Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Navigate to /admin in your app');
    console.log('3. Try uploading a file to test the integration');
    console.log('4. For mock tests: Upload a PDF with MCQs and watch AI process it!');
    
  } catch (error) {
    console.log('❌ Setup failed:', error.message);
    console.log('💡 Make sure your Supabase project is properly configured');
  }
  
  rl.close();
}

// Run setup
setupSupabase().catch(console.error);

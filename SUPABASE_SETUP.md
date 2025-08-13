# 🔧 Supabase Backend Setup Guide

## 🚨 Current Issues
1. **Missing Environment Variables** - Supabase credentials not configured
2. **Missing Storage Buckets** - File upload functionality broken
3. **Database Not Initialized** - Tables not created yet

## 📋 Step-by-Step Setup

### 1. Create Environment Variables
Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**To get these values:**
1. Go to [supabase.com](https://supabase.com)
2. Create/Open your project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

### 2. Initialize Supabase Database
Run these commands in your project directory:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your_project_ref

# Run migrations to create tables
supabase db push

# Start local development (optional)
supabase start
```

**Alternative: Manual Migration (if CLI doesn't work)**
1. Go to your Supabase dashboard → SQL Editor
2. Run the main migration: `supabase/migrations/20250809163132_tender_resonance.sql`
3. Run the mock test fix: `supabase/migrations/20250813_fix_mock_test_schema.sql`

### 3. Create Storage Buckets
In your Supabase dashboard:

1. Go to **Storage** → **Buckets**
2. Create these buckets:
   - `notes` - for text notes (optional, for file attachments)
   - `avatars` - for user profile pictures
   - `question-images` - for question images

3. Set bucket policies:
   ```sql
   -- Allow authenticated users to upload to notes bucket
   CREATE POLICY "Users can upload notes" ON storage.objects
   FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'notes');
   
   -- Allow users to read notes
   CREATE POLICY "Users can read notes" ON storage.objects
   FOR SELECT TO authenticated
   USING (bucket_id = 'notes');
   

   ```

### 4. Test Backend Integration
After setup, test these endpoints:

- ✅ Database tables created
- ✅ File upload working
- ✅ CRUD operations functional
- ✅ Authentication working

## 🔍 Troubleshooting

### Common Issues:
1. **"Bucket not found"** → Create storage buckets
2. **"Invalid API key"** → Check environment variables
3. **"Table doesn't exist"** → Run database migrations
4. **"RLS policy violation"** → Check row-level security policies
5. **"Column 'subject_id' does not exist"** → Run the mock test schema fix migration

### Quick Fix Commands:
```bash
# Reset database
supabase db reset

# Check status
supabase status

# View logs
supabase logs

# Fix mock test schema (if you get column errors)
# Run this in Supabase SQL Editor:
# supabase/migrations/20250813_fix_mock_test_schema.sql
```

## 📱 Test the Admin Panel
Once setup is complete:
1. Navigate to `/admin`
2. Try uploading a file
3. Create/edit questions
4. Manage users and notes
5. **Upload PDF Mock Tests** - The new AI-powered feature!

## 🎯 New Feature: Text-Based Content Upload

### **How It Works:**
1. **Upload TXT**: Upload a .txt file with your content
2. **Direct Processing**: System reads and parses the text directly
3. **Automatic Creation**: Creates structured content in the database
4. **Ready to Use**: Content is immediately available

### **What You Need:**
- Text files (.txt) with proper formatting
- Proper subject selection during upload
- No external AI services required

### **Supported Formats:**
- **Questions**: TXT files with MCQs (4 options per question)
- **Notes**: TXT files with study materials and explanations
- **Mock Tests**: TXT files with complete MCQ sets
- **CSV**: Still supported for bulk question uploads

The admin panel should now work with full backend integration and text-based content creation!

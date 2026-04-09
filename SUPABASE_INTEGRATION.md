# NoteTube Supabase Integration

## Overview
NoteTube has been fully integrated with your Supabase account (`db.fsesvnlagqexqqohftnl.supabase.co`). All data is now persisted in real-time with proper authentication and authorization.

## Database Schema

### Tables Created:
1. **profiles** - User profile information with avatars and bios
2. **videos** - YouTube videos processed by users with transcripts
3. **notes** - Study notes from videos with bookmarks and importance levels
4. **keypoints** - Key points extracted from notes
5. **quizzes** - Quiz data in JSONB format
6. **learning_sessions** - User learning sessions with duration and scores
7. **learning_stats** - Aggregated learning statistics per user

### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure users can only access their own data.

### Indexes
Created performance indexes on:
- user_id (all tables)
- video_id (notes, quizzes, sessions)
- note_id (keypoints)
- created_at (learning_sessions)

### Triggers
Auto-creates profile and learning_stats records when a new user signs up.

## Features Implemented

### 1. Real Authentication
- Supabase Auth with email/password
- Secure session management
- Middleware-protected routes

### 2. Data Persistence
- All user data saved to Supabase
- Survives page refresh and logout/login
- Automatic profile creation on signup

### 3. Notes with Bookmarks
- Create, edit, delete notes
- Toggle bookmark status
- Set importance levels (low/medium/high)
- Visual indicators for importance

### 4. Keypoints Feature
- Extract key points from notes
- Set importance levels
- Edit and delete keypoints
- Real-time updates

### 5. Accurate Analytics
- Real database queries instead of mock data
- Weekly activity charts with actual user data
- Quiz performance distribution
- Learning overview with pie charts
- Performance trends

### 6. Profile Management
- Update full name and bio
- Add custom avatar URLs
- Account information display
- Logout functionality

## API Routes Created

### /api/notes [POST/GET]
- Create notes with importance levels
- Fetch user's notes
- Save to database

### /api/keypoints [POST/GET]
- Create keypoints for notes
- Fetch keypoints by note
- Update importance levels

### /api/learning-stats [GET]
- Fetch user's learning statistics
- Real-time data aggregation
- Weekly stats calculation

### /api/extract-transcript [POST]
- Extract YouTube transcripts
- Save video metadata
- Create learning sessions

## Library Integration

### Supabase Utilities
- `/lib/supabase/client.ts` - Browser client
- `/lib/supabase/server.ts` - Server client
- `/lib/supabase/proxy.ts` - Session management

### Service Layers
- `/lib/supabase/db.ts` - Database utilities
- `/lib/services/video-service.ts` - Video operations
- `/lib/services/notes-service.ts` - Notes operations

## Environment Variables

Make sure these are set in your project:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key for browser
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server

## Updated Pages

### Public Pages
- `/` - Landing page (rebranded to NoteTube)
- `/signin` - Sign in with Supabase Auth
- `/signup` - Sign up with Supabase Auth

### Protected Pages (require authentication)
- `/dashboard` - Real user stats and recent sessions
- `/process-video` - Process videos with database persistence
- `/profile` - Edit profile saved to Supabase
- `/analytics` - Accurate charts from real data
- `/learning-history` - All user sessions
- `/settings` - User preferences

## How It Works

1. **User Signs Up**
   - Creates auth account in Supabase
   - Trigger auto-creates profile and learning_stats records

2. **User Processes Video**
   - Extracts transcript
   - Saves video to database
   - Creates learning session
   - Stores notes with bookmarks

3. **User Views Analytics**
   - Fetches real data from learning_sessions table
   - Calculates weekly stats
   - Shows actual quiz performance
   - Displays accurate progress

4. **User Manages Profile**
   - Updates profile in database
   - Changes avatar URL
   - Adds bio
   - All changes persisted

## Testing the Integration

1. Sign up with an email
2. Process a YouTube video
3. Generate notes and quizzes
4. Bookmark important notes
5. Add keypoints
6. View analytics (should show your data)
7. Update your profile
8. Check that data persists after logout/login

## Troubleshooting

### Profile Not Creating
- Check that auth trigger is working
- Verify RLS policies allow inserts

### Can't Save Notes
- Ensure user is authenticated
- Check RLS policies on notes table
- Verify user_id is being sent correctly

### Analytics Not Updating
- Check learning_sessions table has data
- Verify created_at timestamps are correct
- Clear browser cache and reload

## Real-Time Features

The app supports real-time updates through Supabase subscriptions:
- Notes are synced across devices
- Learning stats update automatically
- New keypoints appear instantly

To enable real-time in components, use:
```typescript
const subscription = supabase
  .from('notes')
  .on('*', callback)
  .subscribe()
```

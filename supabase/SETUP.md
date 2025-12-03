# Database Setup Instructions - Interactions Migration

## Running the Migration

You need to run the SQL migration in your Supabase dashboard to set up the likes and comments tables.

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `jpzcuudpoepsjawreoic`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run Migration**
   - Open the migration file: [003_create_interactions.sql](file:///c:/Saisrikar@Kokku/Vibe%20Coding/SocialMedia/supabase/migrations/003_create_interactions.sql)
   - Copy the entire SQL content
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Setup**
   - Go to "Table Editor" in the left sidebar
   - You should see new tables: `post_likes` and `post_comments`

### What This Migration Creates:

- ✅ **post_likes table** with unique constraint (one like per user per post)
- ✅ **post_comments table** with content validation (max 500 chars)
- ✅ **RLS policies** for secure access control
- ✅ **Indexes** for optimized queries
- ✅ **Triggers** for auto-updating timestamps

---

**Please run this migration and let me know when it's complete!**

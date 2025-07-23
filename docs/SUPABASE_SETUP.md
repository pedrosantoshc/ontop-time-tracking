# 🚀 Supabase Migration Setup Guide

This guide will help you migrate your Ontop Time Tracking app from LocalStorage to Supabase.

## 📋 Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Vercel Account** (optional): For deployment with analytics

## 🗄️ Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project name: `ontop-time-tracking`
5. Set a strong database password
6. Choose your region
7. Click "Create new project"

## 🛠️ Step 2: Set Up Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` (in your project root)
3. Paste it into the SQL Editor
4. Click **Run** to create all tables and policies

## 🔑 Step 3: Configure Environment Variables

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy your **Project URL** and **anon public** key
3. Update your environment files:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_PROJECT_URL_HERE',
  supabaseAnonKey: 'YOUR_ANON_KEY_HERE'
};

// src/environments/environment.prod.ts  
export const environment = {
  production: true,
  supabaseUrl: 'YOUR_PROJECT_URL_HERE',
  supabaseAnonKey: 'YOUR_ANON_KEY_HERE'
};
```

## 📦 Step 4: Install Dependencies (Already Done)

✅ Vercel Analytics: `@vercel/analytics`
✅ Supabase Client: `@supabase/supabase-js`

## 🔄 Step 5: Migrate Your Data

The migration service is ready to use. In your browser console, you can run:

```javascript
// Open browser dev tools and run:
// (This will be available as a service method in your app)
await migrationService.migrateAllDataToSupabase();
```

Or add a temporary migration button to your settings page for easy migration.

## 🧪 Step 6: Test Your Migration

After migration, use the validation service:

```javascript
// Validate that all data migrated correctly
const result = await migrationService.validateMigration();
console.log(result.report);
```

## 🚀 Step 7: Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_ANON_KEY`: Your anon key
4. Deploy!

## 🔒 Security Considerations

### Row Level Security (RLS)
The schema includes basic RLS policies. You may want to customize these based on your authentication requirements.

### Authentication
Consider implementing proper user authentication:
- Supabase Auth with email/password
- Magic link authentication  
- OAuth with Google/GitHub

### Environment Variables
Never expose your Supabase keys in client-side code for production. The anon key is safe for client-side use, but consider using service role key for server-side operations.

## 📊 Database Schema Overview

### Tables Created:
- **clients**: Store client information and tracking preferences
- **workers**: Store worker/contractor information linked to clients
- **time_entries**: Store time tracking entries (clock in/out or manual)
- **proof_of_work**: Store screenshots, files, and notes as proof

### Key Features:
- ✅ Full referential integrity with foreign keys
- ✅ Row Level Security policies
- ✅ Automatic timestamps (created_at, updated_at)
- ✅ Proper indexing for performance
- ✅ Check constraints for data validation

## 🐛 Troubleshooting

### Common Issues:

1. **Connection Error**: Verify your Supabase URL and key are correct
2. **RLS Blocking Queries**: Check that your RLS policies match your auth setup
3. **Migration Fails**: Check browser console for specific error messages
4. **Data Type Mismatches**: Ensure your TypeScript interfaces match database schema

### Debug Mode:
Enable debug logging by opening browser dev tools before running migrations.

## 🔄 Rollback Plan

If something goes wrong, your original LocalStorage data remains intact until you manually clear it. You can continue using the app with LocalStorage while troubleshooting Supabase issues.

## 📞 Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- Check browser console for detailed error messages

---

**Ready to migrate?** Follow the steps above, then test thoroughly before clearing your LocalStorage data!
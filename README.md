# SocialNest 🪺

A modern, full-featured social media platform built with Next.js and Supabase.

## ✨ Features

- 🔐 **Authentication** - Secure signup/login with email verification
- 👤 **User Profiles** - Customizable profiles with avatars and bios
- 📝 **Posts** - Create, edit, and delete posts with image uploads
- ❤️ **Interactions** - Like and comment on posts with real-time updates
- 👥 **Follow System** - Follow users and view personalized feeds
- 🔔 **Notifications** - Real-time notifications for all interactions
- 💬 **Direct Messaging** - 1-on-1 chat with real-time sync
- 🔍 **Search & Explore** - Discover users and trending content
- 🛡️ **Moderation** - Report system and admin dashboard

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Styling**: Tailwind CSS
- **Testing**: Jest, Playwright
- **Deployment**: Vercel + Supabase

## 📋 Prerequisites

- Node.js 18.x or 20.x
- npm or yarn
- Supabase account

## 🛠️ Local Development Setup

### 1. Clone the repository

\`\`\`bash
git clone <repository-url>
cd SocialMedia
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Configure environment variables

Copy the example environment file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Update `.env.local` with your Supabase credentials:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 4. Run the development server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

### Run unit tests

\`\`\`bash
npm test
\`\`\`

### Run E2E tests

\`\`\`bash
npm run test:e2e
\`\`\`

### Type checking

\`\`\`bash
npm run type-check
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

## 📦 Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## 🗄️ Database Setup

The database schema will be created in subsequent phases. For now, ensure your Supabase project is set up and credentials are configured.

## 📁 Project Structure

\`\`\`
SocialMedia/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   └── ui/          # Reusable UI components
│   ├── lib/             # Utility functions and configurations
│   │   └── supabase/    # Supabase client setup
│   ├── types/           # TypeScript type definitions
│   └── middleware.ts    # Next.js middleware for auth
├── e2e/                 # Playwright E2E tests
├── __tests__/           # Jest unit tests
├── public/              # Static assets
└── .github/             # GitHub Actions workflows
\`\`\`

## 🔒 Security

- Row-Level Security (RLS) enabled on all database tables
- Secure authentication with Supabase Auth
- Environment variables for sensitive data
- Security headers configured in Next.js

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

### Supabase Setup

1. Create a new Supabase project
2. Run database migrations (coming in Phase 2)
3. Configure storage buckets for images
4. Set up RLS policies

## 📝 Development Workflow

This project follows a phased development approach:

- **Phase 1**: Project Setup ✅
- **Phase 2**: Authentication & Profiles (Next)
- **Phase 3**: Post System
- **Phase 4**: Interactions (Likes & Comments)
- **Phase 5**: Follow System
- **Phase 6**: Real-Time Notifications
- **Phase 7**: Direct Messaging
- **Phase 8**: Search & Explore
- **Phase 9**: Moderation & Reporting
- **Phase 10**: Testing & QA
- **Phase 11**: Deployment
- **Phase 12**: Polish & Advanced Features

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📄 License

MIT

## 🆘 Support

For issues and questions, please open a GitHub issue.

---

Built with ❤️ using Next.js and Supabase

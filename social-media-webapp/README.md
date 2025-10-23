# Social Media Web App

A modern, full-featured social media web application built with Next.js 16, React 19, TypeScript, and Supabase.

## Features

- **Authentication**: Complete user authentication system with login, registration, and profile setup
- **User Profiles**: Customizable profiles with avatars, cover images, and bios
- **Posts & Feed**: Create, view, edit, and delete posts with media support
- **Real-time Updates**: Live feed updates using Supabase real-time subscriptions
- **Responsive Design**: Fully responsive UI that works on mobile, tablet, and desktop
- **Dark Mode**: Built-in theme switching support
- **Settings**: Comprehensive account and security settings

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: React Context API
- **Form Handling**: React Hook Form + Zod
- **Testing**: Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 20+ installed
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NODE_ENV=development
```

4. Set up the database:

Run the SQL schema from `supabase.sql` in your Supabase SQL editor to create all necessary tables and functions.

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
social-media-webapp/
├── src/
│   ├── app/
│   │   ├── (app)/          # Main app routes (with AppShell)
│   │   │   ├── page.tsx    # Home feed
│   │   │   ├── messages/   # Messages page
│   │   │   ├── profile/    # User profiles
│   │   │   ├── settings/   # Settings page
│   │   │   └── users/      # User discovery
│   │   ├── (auth)/         # Auth routes (without AppShell)
│   │   │   ├── login/      # Login page
│   │   │   ├── register/   # Registration page
│   │   │   └── profile-setup/ # Profile setup
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── auth/           # Authentication components
│   │   ├── layout/         # Layout components (sidebar, topbar, etc.)
│   │   ├── posts/          # Post-related components
│   │   ├── settings/       # Settings components
│   │   └── ui/             # Reusable UI components
│   ├── lib/
│   │   ├── contexts/       # React contexts (auth, theme, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   ├── supabase/       # Supabase client configuration
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── middleware.ts       # Next.js middleware for auth
└── public/                 # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage

## Authentication Flow

1. Users can register with email, username, and display name
2. After registration, users are redirected to profile setup (optional)
3. Users can log in with email and password
4. Authenticated users are redirected to the home feed
5. Unauthenticated users are redirected to the login page

## Database Schema

The app uses the following main tables:
- `users` - User profiles and account information
- `posts` - User posts with media support
- `comments` - Comments on posts
- `likes` - Post likes
- `follows` - User follow relationships
- `notifications` - User notifications
- `messages` - Direct messages

See `supabase.sql` for the complete schema.

## Contributing

This is a beta version. Please report any issues or bugs you encounter.

## License

See LICENSE file for details.

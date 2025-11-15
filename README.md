# VideoPilots AI - Next.js Version

**VideoPilots AI** is an intelligent learning platform that transforms YouTube into a structured educational experience. Using AI-powered video curation and scoring, it creates personalized learning paths tailored to your skill level, learning goals, and preferred video duration. Whether you're learning to code, mastering a new language, or exploring any topic, VideoPilots AI helps you find the best educational content and guides you through it step-by-step.

## 🎯 What is VideoPilots AI?

VideoPilots AI solves the problem of information overload on YouTube. Instead of spending hours searching for the right tutorials, the platform:

- **Searches** YouTube for relevant educational videos on your chosen topic
- **Scores** videos based on quality, relevance, and educational value
- **Curates** the best videos into a structured learning path
- **Tracks** your progress as you complete each video
- **Adapts** to your skill level (beginner, intermediate, or advanced)

Perfect for students, professionals, and lifelong learners who want to learn efficiently from YouTube's vast educational content.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL
- **Authentication**: NextAuth v5
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Type Safety**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- YouTube API key (optional for development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your PostgreSQL database:
```bash
# Create a new database
createdb videopilots_ai

# Run the schema
psql videopilots_ai < database/schema.sql
```

3. Create a `.env.local` file in the root directory:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/videopilots_ai

# NextAuth
AUTH_SECRET=your-secret-key-here
# Generate with: openssl rand -base64 32
AUTH_URL=http://localhost:3000

# YouTube API (optional)
NEXT_PUBLIC_YOUTUBE_API_KEY=your-youtube-api-key

# Node Environment
NODE_ENV=development
```

4. Run the development server:
```bash
npm run dev
```

5. Run the database migration:
```bash
npm run db:migrate
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
videopilots-ai-nextjs/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── subscriptions/ # Subscription endpoints
│   ├── (pages)/           # Page routes
│   └── layout.tsx        # Root layout
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions
│   ├── db.ts            # Database connection
│   └── utils.ts         # Helper functions
├── database/             # Database schema
│   └── schema.sql       # PostgreSQL schema
└── auth.ts             # NextAuth configuration
```

## ✨ Key Features

### 🎓 AI-Powered Learning Paths
- **Smart Video Discovery**: Automatically searches YouTube for the best educational content on any topic
- **Intelligent Scoring**: Videos are scored based on relevance, quality, views, recency, and educational value
- **Structured Progression**: Videos are ordered from beginner to advanced for optimal learning flow
- **Customizable Preferences**: Choose your skill level, preferred video duration, and learning goals

### 📊 Progress Tracking & Analytics
- **Video Completion Tracking**: Mark videos as complete and track your progress through each learning path
- **Learning Streaks**: Build and maintain daily learning streaks to stay motivated
- **Time Tracking**: Monitor total learning time across all your paths
- **Dashboard Overview**: View comprehensive statistics including completed videos, active paths, and learning metrics

### 💾 Save & Organize
- **Save Learning Paths**: Bookmark your favorite paths for easy access later
- **Multiple Paths**: Create unlimited learning paths (based on your subscription tier)
- **Search & Filter**: Quickly find paths by topic, skill level, or saved status
- **Path Management**: Delete, save, or unsave paths as needed

### 🔐 User Accounts & Security
- **Secure Authentication**: Email/password authentication with NextAuth
- **User Profiles**: Personalized accounts with learning history and preferences
- **Data Privacy**: All your learning data is securely stored and private

### 💳 Subscription Tiers
- **Free Plan**: 3 learning paths per month, basic features
- **Pro Plan**: Unlimited paths, saved paths, analytics, notes, goals, and data export
- **Team Plan**: All Pro features plus team collaboration and shared paths

### 🎨 Modern User Experience
- **Beautiful UI**: Clean, modern interface built with Tailwind CSS and shadcn/ui
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Fast Performance**: Optimized for speed with Next.js server-side rendering
- **Real-time Updates**: Instant feedback and updates as you interact with the platform

## PayPal Integration

PayPal integration code has been moved to a separate folder: `/Users/sabari/Desktop/videopilots-paypal-integration`

To integrate PayPal payments:
1. Copy the PayPal code from the separate folder
2. Set up PayPal API credentials
3. Create API routes for payment processing

## Security Features

- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Secure session management
- Password hashing with bcrypt
- Input validation with Zod

## Database Schema

The database schema includes:
- User profiles and authentication
- Subscription plans and user subscriptions
- Usage tracking
- Learning paths and progress
- Video cache
- User notes and goals

See `database/schema.sql` for the complete schema.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Secret key for NextAuth (generate with `openssl rand -base64 32`)
- `AUTH_URL` - Base URL of your application

Optional:
- `NEXT_PUBLIC_YOUTUBE_API_KEY` - YouTube Data API key
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` - PayPal client ID (if using PayPal)
- `PAYPAL_CLIENT_SECRET` - PayPal client secret (server-side only)

## Migration from Vite/React

This project has been migrated from a Vite + React setup to Next.js with:
- NextAuth instead of Supabase Auth
- Direct PostgreSQL connection instead of Supabase
- Next.js App Router instead of React Router
- Server-side API routes instead of client-side Supabase calls

## 📖 How to Use VideoPilots AI

### Step 1: Create an Account

1. Visit the homepage at `http://localhost:3000`
2. Click **"Sign In"** in the header
3. Choose **"Create Account"** if you're new, or **"Sign In"** if you have an account
4. Enter your email and password to register
5. You'll be automatically signed in after registration

### Step 2: Create Your First Learning Path

1. On the homepage, you'll see a form to create a learning path
2. **Enter what you want to learn**: Type any topic (e.g., "React Hooks", "Machine Learning", "Spanish Grammar")
3. **Select your skill level**:
   - 🌱 **Beginner**: New to the topic
   - 📚 **Intermediate**: Some prior knowledge
   - 🎯 **Advanced**: Looking to deepen expertise
4. **Choose video length preference**:
   - ⚡ 5-10 minutes (Quick tutorials)
   - ⏱️ 10-20 minutes (Standard lessons)
   - 📖 20-30 minutes (In-depth content)
   - 🎓 30+ minutes (Comprehensive courses)
5. **Add learning goal (optional)**: Specify what you want to achieve (e.g., "Build a portfolio project", "Pass an exam")
6. Click **"Find My Learning Path"**

### Step 3: Review Your Learning Path

1. After creating a path, you'll be redirected to the results page
2. You'll see a curated list of YouTube videos ordered from beginner to advanced
3. Each video shows:
   - Title and channel name
   - Thumbnail
   - Duration
   - View count
   - Published date
4. Videos are automatically scored and ranked for optimal learning progression

### Step 4: Start Learning

1. Click on any video to open it in a new tab (opens YouTube)
2. Watch the video at your own pace
3. Return to VideoPilots AI and mark the video as **complete** by clicking the checkmark
4. Your progress is automatically saved
5. Continue through the path, completing videos in order

### Step 5: Track Your Progress

1. Visit your **Dashboard** (`/dashboard`) to see:
   - Current learning streak
   - Total learning time
   - Number of completed videos
   - Active learning paths
   - Usage statistics
2. View all your learning paths at `/learning-paths`
3. Filter paths by:
   - Search query (topic name)
   - Skill level
   - Saved status

### Step 6: Manage Your Paths

- **Save a path**: Click the bookmark icon to save a path for easy access later
- **Delete a path**: Click the delete button to remove paths you no longer need
- **View path details**: Click on a path card to see all videos and progress
- **Continue learning**: Pick up where you left off on any saved path

### Step 7: Upgrade Your Plan (Optional)

1. Visit the **Pricing** page (`/pricing`)
2. Compare features across Free, Pro, and Team plans
3. Choose monthly or yearly billing (yearly saves 17%)
4. Click **"Upgrade"** to unlock premium features:
   - Unlimited learning paths
   - Advanced analytics
   - Video notes
   - Learning goals
   - Data export

## 🎯 Best Practices

### Getting the Best Results

1. **Be Specific**: Instead of "programming", try "React Hooks" or "Python Data Analysis"
2. **Choose Appropriate Skill Level**: This helps the AI find videos that match your current knowledge
3. **Set Learning Goals**: Adding a goal helps the AI understand your intent and find more relevant content
4. **Complete Videos in Order**: Paths are structured for optimal learning progression
5. **Save Important Paths**: Bookmark paths you want to revisit or share

### Maximizing Your Learning

- **Consistency**: Try to maintain a daily learning streak
- **Take Notes**: Use the notes feature (Pro/Team) to jot down key concepts
- **Set Goals**: Create learning goals to stay focused (Pro/Team)
- **Track Progress**: Regularly check your dashboard to see your learning statistics
- **Explore Topics**: Create multiple paths to explore different subjects

## 🔧 Advanced Usage

### Using the API

The application provides RESTful API endpoints for programmatic access:

- `GET /api/learning-paths` - List all your learning paths
- `POST /api/learning-paths` - Create a new learning path
- `GET /api/learning-paths/[id]` - Get a specific learning path
- `PATCH /api/learning-paths/[id]` - Update a learning path
- `DELETE /api/learning-paths/[id]` - Delete a learning path
- `GET /api/progress` - Get your learning progress and statistics
- `POST /api/progress` - Mark a video as complete
- `GET /api/subscriptions/plans` - Get available subscription plans
- `GET /api/subscriptions/user` - Get your current subscription

### Database Migration

To set up or update the database schema:

```bash
npm run db:migrate
```

This will:
- Create all necessary tables
- Set up indexes for performance
- Seed subscription plans (Free, Pro, Team)
- Verify the database connection

## 🚀 Deployment

### Production Setup

1. **Set up PostgreSQL database**:
   - Use a managed service (AWS RDS, Heroku Postgres, etc.)
   - Or set up your own PostgreSQL server

2. **Configure environment variables**:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/database
   AUTH_SECRET=your-production-secret
   AUTH_URL=https://yourdomain.com
   NODE_ENV=production
   ```

3. **Run database migration**:
   ```bash
   npm run db:migrate
   ```

4. **Build the application**:
   ```bash
   npm run build
   ```

5. **Start the production server**:
   ```bash
   npm start
   ```

### Recommended Hosting Platforms

- **Vercel**: Optimized for Next.js, automatic deployments
- **Railway**: Easy PostgreSQL setup, simple deployment
- **Render**: Full-stack hosting with PostgreSQL
- **DigitalOcean App Platform**: Scalable hosting solution

## 📚 Additional Resources

### Understanding Subscription Limits

- **Free Plan**: 3 learning paths per month (resets monthly)
- **Pro Plan**: Unlimited learning paths, all premium features
- **Team Plan**: Everything in Pro plus collaboration features

### Usage Tracking

The platform tracks:
- Learning paths created (monthly limit for free users)
- Video searches performed
- Analytics views (Pro/Team only)

### Video Caching

Videos are cached to reduce YouTube API calls and improve performance. Cached data includes:
- Video title and description
- Channel name
- Thumbnail URL
- Duration and view count
- Published date

## 🤝 Contributing

This is a private project. For questions or issues, please contact the project maintainer.

## 📄 License

Private project

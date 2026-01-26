# Campus Trails 🗺️

**Helping college students discover the best places around campus**

Campus Trails is a mobile app built with React Native (Expo) and Supabase that helps new students find nearby places, hangout spots, affordable food places, and more. Students can add places, search by tags, and review locations - making campus life easier for freshers!

---

## 🎯 Features

### ✅ Phase 1: Authentication & Roles (COMPLETED)

- Email/password authentication with Supabase
- Restricted to @vitapstudent.ac.in email domain
- Role-based access control (Admin & Student)
- Protected routes and session management

### 🚧 Coming Next

- **Phase 2**: Places Management (add, view, edit places)
- **Phase 3**: Search & Filter by tags/names
- **Phase 4**: Reviews & Ratings system
- **Phase 5**: Admin Dashboard
- **Phase 6**: Map Integration

---

## 🚀 Quick Start

### Prerequisites

- Node.js installed
- Expo CLI
- Supabase account

### Setup (5 minutes)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Supabase**
   - Create a Supabase project at https://supabase.com
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and anon key

3. **Run database migration**
   - Go to Supabase SQL Editor
   - Run the SQL from `supabase/migrations/001_initial_schema.sql`

4. **Start the app**
   ```bash
   npm start
   ```

📖 **Detailed setup instructions**: See [QUICKSTART.md](QUICKSTART.md)

---

## 📱 User Roles

### 👤 Student (Default)

- Add and edit own places
- Review and rate places
- Search and discover locations

### 👑 Admin

- All student permissions
- Delete any place
- Manage user content

---

## 🏗️ Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for images)
- **Language**: TypeScript

---

## 📁 Project Structure

```
campus-trails/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Protected tab screens
│   ├── login.tsx          # Login screen
│   ├── signup.tsx         # Signup screen
│   └── _layout.tsx        # Root layout with auth
├── contexts/              # React contexts
│   └── auth-context.tsx   # Auth state management
├── lib/                   # Utilities
│   └── supabase.ts       # Supabase client config
├── types/                 # TypeScript types
│   └── database.types.ts  # Database type definitions
├── supabase/              # Database migrations
│   └── migrations/
└── components/            # Reusable components
```

---

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Email domain validation (@vitapstudent.ac.in)
- Secure token storage with AsyncStorage
- Server-side and client-side validation

---

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - 5-minute setup guide
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup instructions
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - Complete project roadmap

---

## 🐛 Troubleshooting

**Can't login after signup?**

- Check if email confirmations are enabled in Supabase
- Supabase → Authentication → Settings → Disable for testing

**Environment variables not loading?**

```bash
npx expo start -c  # Clear cache and restart
```

**Email validation error?**

- Ensure you're using @vitapstudent.ac.in email

More help: See [SETUP_GUIDE.md](SETUP_GUIDE.md#troubleshooting)

---

## 🚀 Development

This project uses Expo Router for navigation and TypeScript for type safety.

**Start development server:**

```bash
npm start
```

**Run on specific platform:**

```bash
npm run android
npm run ios
npm run web
```

---

## 📝 License

MIT License - feel free to use this project for your college!

---

## 🤝 Contributing

This is a college project. Feel free to fork and adapt for your institution!

---

**Ready to get started?** Check out [QUICKSTART.md](QUICKSTART.md) 🚀

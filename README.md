# Campus Trails

Campus Trails is a React Native mobile application (Expo + Expo Router) for discovering, adding, and reviewing student-friendly places around campus.

It combines:
- Supabase Auth for login and session management
- Postgres (via Supabase) for places, profiles, and reviews
- Supabase Storage for place images
- Map-driven discovery using current location and nearby place queries

## Documentation Index

- [docs/SETUP.md](docs/SETUP.md): local setup and first run
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): app structure, route map, data flow
- [docs/DATABASE.md](docs/DATABASE.md): schema, RLS, functions, storage policies
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Expo build and release notes
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md): common issues and fixes

## Current Features

- Authentication with Supabase email/password
- Domain restriction to `@vitap.ac.in` and `@vitapstudent.ac.in` (client + DB trigger)
- Profile creation on signup (trigger-backed)
- Role model (`student`, `admin`) with admin delete capability for places
- Home dashboard with quick stats
- Place discovery on map with current location
- Nearby place search via Supabase RPC (`get_nearby_places`)
- Combined search suggestions from internal DB and OpenStreetMap Nominatim
- Add new places with:
  - map location picker
  - tag selection
  - up to 5 images uploaded to Supabase Storage
- Place detail page with images, tags, map, author info, and reviews
- Review create/update flow (one review per user per place)
- Theme preference support (`light`, `dark`, `system`)

## Tech Stack

- Framework: Expo SDK 54, React Native 0.81, React 19
- Navigation: Expo Router
- Backend: Supabase
- DB: PostgreSQL with Row Level Security
- Storage: Supabase Storage (`images` bucket)
- Maps/Location: `react-native-maps`, `expo-location`
- Language: TypeScript

## Quick Start

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and fill values.

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
   ```

3. Run SQL migrations in Supabase SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage_setup.sql`

4. Start development server.

   ```bash
   npm start
   ```

5. Run on platform.

   ```bash
   npm run android
   npm run ios
   npm run web
   ```

For full setup details, see [docs/SETUP.md](docs/SETUP.md).

## Environment Variables

Defined in `.env.example`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

These are consumed by:
- `lib/supabase.ts` (Supabase client)
- `app.config.ts` (native map config)

## NPM Scripts

- `npm start`: start Expo development server
- `npm run android`: run Android native build/dev client
- `npm run ios`: run iOS native build/dev client
- `npm run web`: run web target
- `npm run lint`: run Expo lint

Note: `package.json` contains `reset-project` but the referenced script file is not present in this repository.

## Security Highlights

- RLS enabled for `profiles`, `places`, and `reviews`
- Authenticated read/write policies for places and reviews
- Ownership checks for updates/deletes
- Admin override policy for deleting any place
- Email-domain validation trigger on `auth.users`

See [docs/DATABASE.md](docs/DATABASE.md) for exact policies and functions.

## Project Structure

```text
campus-trails/
  app/                    Expo Router screens
    (tabs)/               Home, Places, Profile tabs
    add-place.tsx         Add place flow (location, tags, image upload)
    place/[id].tsx        Place detail and reviews
    add-review/[id].tsx   Create/update review
    login.tsx             Login screen
    signup.tsx            Signup screen
  contexts/
    auth-context.tsx      Session, profile, role, auth methods
    theme-context.tsx     Theme preference persistence
  lib/
    supabase.ts           Supabase client initialization
  supabase/migrations/
    001_initial_schema.sql
    002_storage_setup.sql
  types/
    database.types.ts     Generated-style DB type declarations
```

## Development Notes

- Protected route handling is centralized in `app/_layout.tsx`.
- Place discovery uses RPC query radius values depending on context:
  - general nearby fetch up to 100 km
  - suggestion fetch context up to 50 km
  - nearby DB places around selected external marker up to 5 km
- Review uniqueness is enforced in DB with `UNIQUE(place_id, user_id)`.

## License

MIT

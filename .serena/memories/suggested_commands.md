# Suggested Commands for Development

## Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Linting
npm run lint
```

## Environment Setup
- Environment variables are managed through `.env` files (gitignored)
- Key environment variables:
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `VITE_ADMIN_EMAIL` - Admin email for access control
  - `VITE_GOOGLE_CUSTOM_SEARCH_API_KEY` - Google Search API key
  - `VITE_GOOGLE_CUSTOM_SEARCH_ENGINE_ID` - Google Search Engine ID

## System Commands (macOS/Darwin)
- `ls` - List files
- `cd` - Change directory
- `find` - Find files
- `grep` - Search text patterns
- `git` - Version control

## Database Management
- Supabase migrations are located in `supabase/migrations/`
- Database operations are handled through the `src/lib/supabase.ts` file
- Generic CRUD operations available for all main entities

## Deployment
- Automatic deployment through Netlify on push to main branch
- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect handling configured in `netlify.toml`
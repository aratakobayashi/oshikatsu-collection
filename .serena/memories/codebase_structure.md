# Codebase Structure

## Root Directory
```
├── src/                    # Main source code
├── supabase/              # Database migrations
├── data/                  # Static data files
├── .bolt/                 # Bolt.new configuration
├── dist/                  # Build output (gitignored)
├── node_modules/          # Dependencies (gitignored)
├── package.json           # Project dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration (root)
├── tsconfig.app.json      # TypeScript config for app
├── tsconfig.node.json     # TypeScript config for Node.js
├── tailwind.config.js     # Tailwind CSS configuration
├── eslint.config.js       # ESLint configuration
├── netlify.toml          # Netlify deployment configuration
└── index.html            # HTML template
```

## Source Code Structure (`src/`)
```
src/
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── TextArea.tsx
│   ├── legal/            # Legal pages components
│   │   ├── About.tsx
│   │   ├── Contact.tsx
│   │   ├── PrivacyPolicy.tsx
│   │   └── TermsOfService.tsx
│   ├── Layout.tsx        # Main layout wrapper
│   ├── AdminLayout.tsx   # Admin layout wrapper
│   ├── AuthProvider.tsx  # Authentication context
│   ├── ProtectedRoute.tsx
│   ├── PublicProtectedRoute.tsx
│   ├── AdminProtectedRoute.tsx
│   ├── LoginForm.tsx
│   ├── HeroSection.tsx
│   ├── Disclaimer.tsx
│   └── WikipediaAPITest.tsx
├── pages/                # Page components
│   ├── public/           # Public pages
│   │   ├── Home.tsx
│   │   ├── Celebrities.tsx
│   │   ├── CelebrityProfile.tsx
│   │   ├── Works.tsx
│   │   ├── WorkDetail.tsx
│   │   ├── Items.tsx
│   │   ├── ItemDetail.tsx
│   │   ├── Locations.tsx
│   │   ├── LocationDetail.tsx
│   │   ├── Posts.tsx
│   │   ├── PostDetail.tsx
│   │   ├── EpisodeDetail.tsx
│   │   ├── Submit.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   └── admin/            # Admin pages
│       ├── Dashboard.tsx
│       ├── Celebrities.tsx
│       ├── Works.tsx
│       ├── Episodes.tsx
│       ├── Items.tsx
│       ├── Locations.tsx
│       ├── UserPosts.tsx
│       ├── DataCollection.tsx
│       └── wikipedia-collector.tsx
├── lib/                  # Business logic and utilities
│   ├── supabase.ts       # Database client and CRUD operations
│   ├── auth.ts           # Authentication utilities
│   └── googleSearch.ts   # Google Search API integration
├── scripts/              # Data collection and utility scripts
│   ├── data-collection/  # Data collection pipeline
│   │   ├── step1-episode-search.ts
│   │   ├── step2-data-extraction-improved.ts
│   │   ├── step3-amazon-api.ts
│   │   ├── step3-b-manual-amazon.ts
│   │   ├── step4-valuecommerce-integration.ts
│   │   ├── step5-database-integration.ts
│   │   └── debug-affiliate-links.ts
│   └── test-google-search.ts
├── types/               # Type definitions
│   └── env.d.ts         # Environment variable types
├── App.tsx              # Main App component with routing
├── main.tsx             # Application entry point
├── index.css            # Global styles (Tailwind)
└── vite-env.d.ts       # Vite environment types
```

## Key Architecture Patterns
- **Route-based code splitting**: Pages organized by access level (public/admin)
- **Generic database operations**: Reusable CRUD patterns in `lib/supabase.ts`
- **Component composition**: Layouts wrapping page content
- **Authentication layers**: Multiple protection levels (public, authenticated, admin)
- **Type-safe database**: Generated TypeScript interfaces for all database tables
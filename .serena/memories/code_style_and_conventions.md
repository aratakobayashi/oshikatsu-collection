# Code Style and Conventions

## TypeScript Configuration
- **Target**: ES2020
- **Module**: ESNext
- **JSX**: react-jsx
- **Strict mode**: Enabled
- **Unused locals/parameters**: Not allowed (strict rules)
- **Type checking**: Full strict mode enabled

## React Conventions
- Functional components with hooks
- TypeScript interfaces for props
- Default exports for components
- Props destructuring with default values
- Comprehensive error handling with console logging

## File Structure
- Components in `src/components/` with subfolders:
  - `ui/` - Reusable UI components (Button, Card, Input, etc.)
  - `legal/` - Legal pages (Privacy, Terms, Contact, About)
- Pages in `src/pages/` split by access level:
  - `public/` - Public accessible pages
  - `admin/` - Admin-only pages
- Business logic in `src/lib/`
- Type definitions in `src/types/`
- Scripts in `src/scripts/` (data collection utilities)

## Styling
- **Tailwind CSS** for all styling
- Utility-first approach
- Custom component variants using className props
- Responsive design patterns

## Naming Conventions
- **Files**: PascalCase for components (e.g., `Button.tsx`, `CelebrityProfile.tsx`)
- **Components**: PascalCase
- **Variables/Functions**: camelCase
- **Database fields**: snake_case (following PostgreSQL conventions)
- **Routes**: kebab-case (e.g., `/privacy-policy`, `/data-collection`)

## Database Patterns
- Comprehensive error logging with emojis for visual clarity
- Generic CRUD operations through helper functions
- Type-safe database operations with generated TypeScript types
- Relationship data fetched with JOIN queries where needed

## Error Handling
- Console logging with emoji indicators (🔍 🔧 ✅ ❌)
- Descriptive error messages
- Environment variable validation with clear error messages

## Import/Export Patterns
- Default exports for main components
- Named exports for utilities and types
- Relative imports for local files
- Absolute imports from node_modules
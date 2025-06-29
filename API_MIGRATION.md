# External API Migration Guide

This codebase has been migrated from direct database access to using external server APIs and from NextAuth.js to custom external API authentication.

## Key Changes

### Removed

- Drizzle ORM and PostgreSQL dependencies
- Redis dependency and resumable streams
- Direct database queries
- Database migration scripts
- Vercel Blob direct integration (file uploads now via external API)
- NextAuth.js authentication system
- OpenTelemetry monitoring
- AI providers (OpenAI direct integration)
- AI tools - All moved to external server
- Artifacts system - All moved to external server
- Artifact-related components and hooks
- Test suite (Playwright e2e tests, unit tests, test utilities)
- Chat model selection system (models.ts, ModelSelector component)
- Visibility selector component (VisibilitySelector)
- Chat action handlers (saveChatModelAsCookie, updateChatVisibility, etc.)

### Added

- External API client (`lib/api/client.ts`)
- API response types (`lib/api/types.ts`)
- HTTP-based data fetching
- Custom authentication system (`lib/auth.ts`)
- Client-side auth context (`lib/auth-context.tsx`)

## Configuration

Set this environment variable:

```
EXTERNAL_API_BASE_URL=http://localhost:8000/api
```

Note:

- No API key is required since user authentication is handled through the external API's login/register endpoints.
- OpenAI API key should NOT be stored in the UI environment. All AI functionality (chat, completions, etc.) should be handled by your external server.
- All AI tools and direct OpenAI integration have been removed from the UI. The chat API currently returns a 501 error until external server integration is implemented.

## Required API Endpoints

Your external API must implement:

### Authentication

- `POST /auth/login` - User authentication
  - Body: `{ email: string, password: string }`
  - Returns: `{ user: { id: string, email: string, createdAt: string } }`

### User Management

- `GET /users?email={email}` - User lookup
- `POST /users` - User creation
  - Body: `{ email: string, password: string }`
  - Returns: `{ user: { id: string, email: string, createdAt: string } }`

### Chat Management

- `GET /chats/{id}` - Get chat by ID
- `POST /chats` - Create chat
- `GET /users/{userId}/chats` - Get user's chats
- `PATCH /chats/{id}` - Update chat (visibility, etc.)
- `DELETE /chats/{id}` - Delete chat

### Message Management

- `GET /chats/{chatId}/messages` - Get messages for chat
- `GET /messages/{id}` - Get message by ID
- `POST /messages` - Save messages
- `DELETE /chats/{chatId}/messages` - Delete messages after timestamp
- `GET /users/{userId}/message-count?hours={hours}` - Get user message count

### File Upload

- `POST /files/upload` - Upload files (multipart/form-data)
  - Accepts: file (binary), userId (string)
  - Returns: file URL and metadata

### Voting & Analytics

- `GET /chats/{chatId}/votes` - Get votes for chat
- `POST /votes` - Submit vote

### AI & Chat Completions (New Requirements)

- `POST /chat/completions` - Streaming chat completions with tool support
- `POST /chat/title` - Generate chat titles from messages

### Artifacts (New Requirements)

- `POST /artifacts/code/generate` - Generate code snippets
- `POST /artifacts/code/update` - Update existing code
- `POST /artifacts/text/generate` - Generate text content
- `POST /artifacts/text/update` - Update existing text
- `POST /artifacts/sheet/generate` - Generate spreadsheet/CSV data
- `POST /artifacts/sheet/update` - Update existing sheets
- `POST /artifacts/image/generate` - Generate images (DALL-E, etc.)
- `POST /artifacts/image/update` - Update/regenerate images

### Tools & Utilities (New Requirements)

See `lib/api/client.ts` for detailed implementation and parameters.

## Authentication System

The application now uses a custom authentication system that:

- Stores user sessions in HTTP-only cookies
- Provides a React context for client-side auth state
- Uses server-side session validation
- Handles login/logout through external API calls

Authentication flow:

1. User logs in via `/login` page
2. Credentials sent to external API `/auth/login` endpoint
3. On success, server creates session cookie
4. Client-side context provides user state
5. Middleware protects routes requiring authentication

## Next Steps

1. Remove database packages: `pnpm remove drizzle-orm postgres redis @vercel/postgres drizzle-kit @vercel/blob next-auth @opentelemetry/api @opentelemetry/api-logs @vercel/otel`
2. Set up your external API server with required endpoints
3. Configure environment variables
4. Test the application

Note: Resumable streaming is disabled without Redis.

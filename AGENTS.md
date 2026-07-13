<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Next.js Frontend Architecture & Engineering Standards

> This document is the **single source of truth** for architecture, conventions, security, and engineering standards for this Next.js frontend application backed by a Spring Boot REST API.
>
> **All contributors and AI agents must follow this guide strictly. No exceptions.**

---

## Table of Contents

1. [Engineering Philosophy](#1-engineering-philosophy)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Environment Variables](#4-environment-variables)
5. [Core Architecture Rules](#5-core-architecture-rules)
6. [Server vs Client Components](#6-server-vs-client-components)
7. [API Layer — Spring Boot Integration](#7-api-layer--spring-boot-integration)
8. [Next.js Route Handlers — Internal Proxy](#8-nextjs-route-handlers--internal-proxy)
9. [TanStack Query — Server State](#9-tanstack-query--server-state)
10. [Zod — Validation & Schema Contracts](#10-zod--validation--schema-contracts)
11. [Zustand — Client UI State](#11-zustand--client-ui-state)
12. [React Hook Form — Form Handling](#12-react-hook-form--form-handling)
13. [Tailwind CSS + shadcn/ui — Styling](#13-tailwind-css--shadcnui--styling)
14. [Authentication Architecture](#14-authentication-architecture)
15. [Security Standards](#15-security-standards)
16. [Middleware — Route Protection](#16-middleware--route-protection)
17. [Error Handling](#17-error-handling)
18. [Performance Standards](#18-performance-standards)
19. [Accessibility Standards](#19-accessibility-standards)
20. [Naming Conventions](#20-naming-conventions)
21. [Import Standards](#21-import-standards)
22. [Code Generation Order (AI Agents)](#22-code-generation-order-ai-agents)
23. [Recommended Packages](#23-recommended-packages)
24. [Production Checklist](#24-production-checklist)
25. [Do's and Don'ts](#25-dos-and-donts)
26. [Figma Design Implementation](#26-figma-design-implementation)

---

## 1. Engineering Philosophy

This project must prioritize, in order:

1. **Security** — Never compromise credentials, tokens, or user data
2. **Maintainability** — Code must be readable and easy to change
3. **Scalability** — Architecture must support growth without rewrites
4. **Type Safety** — TypeScript strict mode; `any` is forbidden
5. **Performance** — Optimize for real users, not benchmarks
6. **Developer Experience** — Consistent patterns, clear conventions
7. **Accessibility** — Usable by everyone

> Short-term hacks are forbidden. Always prefer long-term maintainable solutions.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Frontend framework & routing |
| Language | TypeScript (strict mode) | Type safety across the entire codebase |
| Backend | Spring Boot (REST API) | All business logic and data persistence |
| Server State | TanStack Query v5 | Async data fetching, caching, mutations |
| Client State | Zustand | UI-only global state (theme, modals, sidebar) |
| Validation | Zod | Schema validation for forms and API responses |
| Forms | React Hook Form + Zod | Form state management and validation |
| Styling | Tailwind CSS + shadcn/ui | Utility-first styling with accessible components |
| HTTP Client | Axios (server) / Fetch (client) | API communication |
| Auth | HTTP-only cookies / JWT | Server-side authentication |
| Code Quality | ESLint + Prettier | Consistent code formatting and linting |

---

## 3. Project Structure

```
src/
│
├── app/                              # Next.js App Router — pages, layouts, route handlers
│   ├── (auth)/                       # Route group — public auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (protected)/                  # Route group — all protected pages
│   │   ├── layout.tsx                # Auth guard layout (server-side check)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   ├── page.tsx              # Server Component — fetches and passes data
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/                          # Next.js Route Handlers — internal proxy to Spring Boot
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── logout/route.ts
│   │   └── users/
│   │       ├── route.ts              # GET /api/users, POST /api/users
│   │       └── [id]/route.ts         # GET, PUT, DELETE /api/users/:id
│   ├── layout.tsx                    # Root layout — wraps all providers
│   ├── error.tsx                     # Global error boundary
│   ├── not-found.tsx                 # 404 page
│   └── page.tsx                      # Landing page
│
├── components/                       # Reusable, generic UI components
│   ├── ui/                           # shadcn/ui auto-generated — DO NOT MODIFY DIRECTLY
│   ├── forms/                        # Reusable form components (inputs, selects, etc.)
│   ├── layout/                       # Header, Footer, Sidebar, Navbar
│   ├── shared/                       # Shared components used across features
│   │   ├── AppButton.tsx
│   │   ├── DataTable.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorMessage.tsx
│   └── providers/                    # All React context/provider wrappers
│       ├── QueryProvider.tsx         # TanStack Query client provider
│       └── ThemeProvider.tsx
│
├── features/                         # Feature-based domain modules
│   ├── auth/
│   │   ├── components/               # Auth-specific UI (LoginForm, RegisterForm)
│   │   ├── hooks/                    # useLogin, useLogout, useRegister
│   │   ├── schemas/                  # loginSchema, registerSchema (Zod)
│   │   ├── services/                 # auth API service functions
│   │   ├── store/                    # auth Zustand store (non-sensitive display info only)
│   │   └── types/                    # Auth-related TypeScript types
│   ├── users/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── types/
│   └── dashboard/
│       ├── components/
│       └── hooks/
│
├── lib/                              # Core utilities and shared configuration
│   ├── api/
│   │   ├── server.ts                 # Axios instance — server-side only (has secrets)
│   │   ├── client.ts                 # Fetch wrapper — browser-safe (no secrets)
│   │   └── endpoints.ts              # All Spring Boot endpoint constants
│   ├── validators/                   # Global/shared Zod schemas
│   │   ├── common.schema.ts          # Shared schemas (pagination, UUID, etc.)
│   │   └── index.ts
│   ├── utils/
│   │   ├── cn.ts                     # Tailwind class merging utility
│   │   ├── format.ts                 # Date, currency, string formatters
│   │   └── sanitize.ts               # XSS sanitization helpers
│   └── constants/
│       └── index.ts                  # App-wide constants (routes, config values)
│
├── hooks/                            # Global custom hooks (non-feature-specific)
│   ├── useDebounce.ts
│   ├── useMediaQuery.ts
│   └── usePagination.ts
│
├── store/                            # Global Zustand stores (UI state only)
│   ├── ui.store.ts                   # Sidebar, modals, theme
│   └── index.ts
│
├── types/                            # Global TypeScript type definitions
│   ├── api.types.ts                  # Generic API response types
│   └── index.ts
│
├── styles/
│   └── globals.css                   # Tailwind base imports + CSS variables
│
├── middleware.ts                     # Auth route protection — runs on the Edge
├── .env.local                        # Local secrets — NEVER commit
├── .env.example                      # Safe template — always keep updated
└── next.config.ts                    # Next.js configuration
```

> **Rule:** Never place feature-specific logic outside its feature folder. A `users` component must live in `features/users/`, not in `components/`.

---

## 4. Environment Variables

### `.env.local` — Never Commit This File

```bash
# ── Spring Boot Backend (Server-Side ONLY — no NEXT_PUBLIC_) ─────────────────
SPRING_BOOT_API_URL=http://localhost:8080
SPRING_BOOT_API_KEY=your-secret-internal-api-key

# ── Auth ──────────────────────────────────────────────────────────────────────
AUTH_SECRET=your-auth-secret-minimum-32-characters-long

# ── Public (safe for browser — non-sensitive only) ───────────────────────────
NEXT_PUBLIC_APP_NAME=MyApp
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### `.env.example` — Commit This File

```bash
SPRING_BOOT_API_URL=
SPRING_BOOT_API_KEY=
AUTH_SECRET=
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_APP_URL=
```

### Rules

| Rule | Reason |
|---|---|
| Variables **without** `NEXT_PUBLIC_` | Server-only — never bundled or sent to the browser |
| Variables **with** `NEXT_PUBLIC_` | Exposed to the browser — never put secrets here |
| Always add `.env.local` to `.gitignore` | Prevents accidental credential exposure |
| Validate env vars at startup with Zod | Fail fast if required config is missing |

### Startup Validation — `lib/env.ts`

```typescript
// lib/env.ts — Validates all environment variables at startup
import { z } from "zod";

const serverEnvSchema = z.object({
  SPRING_BOOT_API_URL: z.string().url(),
  SPRING_BOOT_API_KEY: z.string().min(1),
  AUTH_SECRET:         z.string().min(32),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_APP_URL:  z.string().url(),
});

// Only call serverEnv on the server — throws if any variable is missing
export const serverEnv = serverEnvSchema.parse(process.env);

// Safe to use anywhere
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL:  process.env.NEXT_PUBLIC_APP_URL,
});
```

---

## 5. Core Architecture Rules

1. **Server Components are the default.** Every component in `app/` is a Server Component unless `"use client"` is explicitly declared.
2. **Never call Spring Boot directly from Client Components.** All calls requiring credentials must go through Server Components or Next.js Route Handlers.
3. **Credentials live only on the server.** `SPRING_BOOT_API_KEY` and `SPRING_BOOT_API_URL` must never appear in client-side code.
4. **TanStack Query handles all server state.** Never use Zustand to cache or store API-fetched data.
5. **Zustand is for UI state only.** Theme, sidebar, modal visibility, multi-step form progress — nothing else.
6. **Zod validates everything.** Every form input and every API response must pass through a Zod schema before use.
7. **TypeScript strict mode is mandatory.** `any` is forbidden; use `unknown` when a type is genuinely dynamic.
8. **Feature logic stays in its feature folder.** Cross-feature shared logic belongs in `lib/` or `hooks/`.
9. **Never modify `components/ui/` directly.** Always wrap shadcn/ui components in your own component.
10. **Frontend has no business security logic.** Spring Boot owns all permissions, authorization, and security enforcement.

---

## 6. Server vs Client Components

```
app/users/page.tsx            ← Server Component (fetches from Spring Boot with credentials)
  └── UserTable.tsx           ← Server Component (renders static data)
       └── TableFilters.tsx   ← "use client" (handles search input, user interaction)
            └── FilterDropdown.tsx  ← "use client" (shadcn/ui Popover — needs state)
```

### Decision Table

| Capability | Server Component | Client Component |
|---|---|---|
| Access `process.env` secrets | ✅ Yes | ❌ Returns `undefined` |
| Call Spring Boot with credentials | ✅ Yes | ❌ Never |
| `async/await` at component level | ✅ Yes | ❌ No |
| React hooks (`useState`, `useEffect`) | ❌ No | ✅ Yes |
| TanStack Query (`useQuery`, `useMutation`) | ❌ No | ✅ Yes |
| Zustand stores | ❌ No | ✅ Yes |
| Browser event handlers | ❌ No | ✅ Yes |
| Browser APIs (`window`, `document`) | ❌ No | ✅ Yes |
| Bundle size impact | None | Yes |

### Passing Server Data to Client Components

```tsx
// ✅ Correct — fetch in Server Component, pass result as props
// app/users/page.tsx  (Server Component)
export default async function UsersPage() {
  const users = await getUsers(); // Credentials used safely here ✅
  return <UserList users={users} />;
}

// features/users/components/UserList.tsx  (Client Component)
"use client";
export function UserList({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <input onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
      <ul>{filtered.map(u => <li key={u.id}>{u.name}</li>)}</ul>
    </div>
  );
}
```

---

## 7. API Layer — Spring Boot Integration

### `lib/api/server.ts` — Server-Side Only

```typescript
// lib/api/server.ts
// ⚠️ NEVER import this file in any "use client" component
import axios from "axios";
import { serverEnv } from "@/lib/env";

export const serverApi = axios.create({
  baseURL: serverEnv.SPRING_BOOT_API_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-key":    serverEnv.SPRING_BOOT_API_KEY, // Secret — server only ✅
  },
  timeout: 10_000,
});

serverApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.message ?? "An unexpected error occurred";
    throw new ApiError(status ?? 500, message);
  }
);

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}
```

### `lib/api/client.ts` — Browser-Safe

```typescript
// lib/api/client.ts
// Safe for Client Components — calls Next.js Route Handlers, NOT Spring Boot directly
import axios from "axios";

export const clientApi = axios.create({
  baseURL:         "/api",       // Points to Next.js Route Handlers
  withCredentials: true,         // Sends HTTP-only auth cookies automatically
  headers: { "Content-Type": "application/json" },
});
```

### `lib/api/endpoints.ts` — Endpoint Constants

```typescript
// lib/api/endpoints.ts
export const ENDPOINTS = {
  auth: {
    login:   "/api/auth/login",
    logout:  "/api/auth/logout",
    refresh: "/api/auth/refresh",
    me:      "/api/auth/me",
  },
  users: {
    list:   "/api/users",
    byId:   (id: string) => `/api/users/${id}`,
    create: "/api/users",
    update: (id: string) => `/api/users/${id}`,
    delete: (id: string) => `/api/users/${id}`,
  },
} as const;
```

---

## 8. Next.js Route Handlers — Internal Proxy

Client Components never call Spring Boot directly. They call Next.js Route Handlers, which securely proxy the request to Spring Boot.

```
Browser (Client Component)
  ↓  clientApi.get("/users")
Next.js Route Handler  ← injects API key from process.env
  ↓  serverApi.get(ENDPOINTS.users.list)
Spring Boot Backend
```

### Example — `app/api/users/route.ts`

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { serverApi, ApiError } from "@/lib/api/server";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { UserListSchema } from "@/features/users/schemas/user.schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = searchParams.get("page") ?? "0";
    const size = searchParams.get("size") ?? "10";

    const { data } = await serverApi.get(ENDPOINTS.users.list, {
      params: { page, size },
    });

    const validated = UserListSchema.parse(data); // Validate Spring Boot response ✅
    return NextResponse.json(validated);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body     = await request.json();
    const { data } = await serverApi.post(ENDPOINTS.users.create, body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
```

---

## 9. TanStack Query — Server State

### Provider Setup — `components/providers/QueryProvider.tsx`

```tsx
// components/providers/QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:            60 * 1000, // 1 minute
            retry:                1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Query Key Factory — Always Centralize Keys

```typescript
// features/users/hooks/userKeys.ts
export const userKeys = {
  all:    ["users"]                                    as const,
  lists:  () => [...userKeys.all, "list"]              as const,
  list:   (filters: object) => [...userKeys.lists(), filters] as const,
  detail: (id: string) => [...userKeys.all, "detail", id]    as const,
};
```

### Query Hook — `features/users/hooks/useUsers.ts`

```typescript
// features/users/hooks/useUsers.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { UserListSchema } from "@/features/users/schemas/user.schema";
import { userKeys } from "./userKeys";
import type { User } from "@/features/users/types";

async function fetchUsers(): Promise<User[]> {
  const { data } = await clientApi.get("/users"); // Calls Next.js Route Handler
  return UserListSchema.parse(data);              // Zod validation ✅
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn:  fetchUsers,
  });
}
```

### Mutation Hook — `features/users/hooks/useCreateUser.ts`

```typescript
// features/users/hooks/useCreateUser.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api/client";
import { CreateUserSchema } from "@/features/users/schemas/user.schema";
import { userKeys } from "./userKeys";
import type { CreateUserInput } from "@/features/users/types";

async function createUser(input: CreateUserInput) {
  const validated = CreateUserSchema.parse(input); // Validate before sending ✅
  const { data }  = await clientApi.post("/users", validated);
  return data;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() }); // Auto-refetch ✅
    },
  });
}
```

### TanStack Query Rules

- Always use query key factories — never inline raw string arrays
- Never store TanStack Query data in Zustand
- Always handle `isLoading`, `isError`, and empty states in UI
- Separate query hooks (`hooks/queries/`) from mutation hooks (`hooks/mutations/`)
- Use `useInfiniteQuery` for infinite scroll; paginated queries for standard pagination

---

## 10. Zod — Validation & Schema Contracts

Zod schemas are the **contract between frontend and Spring Boot DTOs**. They live inside each feature's `schemas/` folder. Schemas serve two purposes: validating form input before sending, and validating API responses after receiving.

### `features/users/schemas/user.schema.ts`

```typescript
// features/users/schemas/user.schema.ts
import { z } from "zod";

// ── Base ──────────────────────────────────────────────────────────────────────
export const UserSchema = z.object({
  id:        z.string().uuid(),
  name:      z.string().min(1, "Name is required"),
  email:     z.string().email("Invalid email address"),
  role:      z.enum(["ADMIN", "USER", "MODERATOR"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UserListSchema = z.array(UserSchema);

// ── Create ────────────────────────────────────────────────────────────────────
export const CreateUserSchema = z.object({
  name:     z.string().min(1, "Name is required").max(100, "Name too long"),
  email:    z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8,  "Must be at least 8 characters")
    .regex(/[A-Z]/,       "Must contain at least one uppercase letter")
    .regex(/[0-9]/,       "Must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Must contain at least one special character"),
  role:     z.enum(["ADMIN", "USER", "MODERATOR"]).default("USER"),
});

// ── Update ────────────────────────────────────────────────────────────────────
export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

// ── Inferred TypeScript Types ─────────────────────────────────────────────────
export type User            = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
```

### Zod Rules

- **Always validate inbound API responses** — never trust the network payload blindly
- **Always validate outbound form data** — before any mutation or API call
- **Infer TypeScript types from schemas** — `z.infer<typeof Schema>` keeps types in sync automatically
- **Never duplicate types** — if a type is defined by a Zod schema, do not rewrite it in `types/`

---

## 11. Zustand — Client UI State

Zustand manages **synchronous, global UI state only**. Never store API data, tokens, passwords, or any sensitive info.

### `store/ui.store.ts`

```typescript
// store/ui.store.ts
import { create } from "zustand";

type UIState = {
  isSidebarOpen: boolean;
  theme:         "light" | "dark";
  toggleSidebar: () => void;
  setTheme:      (theme: "light" | "dark") => void;
};

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  theme:         "light",
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setTheme:      (theme) => set({ theme }),
}));
```

### `features/auth/store/auth.store.ts` — Non-Sensitive Display Info Only

```typescript
// features/auth/store/auth.store.ts
// Store ONLY non-sensitive display info (name, role) — NEVER tokens or passwords
import { create } from "zustand";

type AuthDisplayState = {
  user:     { id: string; name: string; role: string } | null;
  isAuthed: boolean;
  setUser:  (user: AuthDisplayState["user"]) => void;
  clear:    () => void;
};

export const useAuthStore = create<AuthDisplayState>((set) => ({
  user:     null,
  isAuthed: false,
  setUser:  (user) => set({ user, isAuthed: !!user }),
  clear:    () => set({ user: null, isAuthed: false }),
}));
```

### Zustand Boundary

| ✅ Use Zustand For | ❌ Never Use Zustand For |
|---|---|
| Sidebar open/closed state | API-fetched data (use TanStack Query) |
| Light/dark theme preference | JWT tokens or session data |
| Modal open/closed state | Passwords or secrets |
| Multi-step form progress | Business logic state |
| Toast/notification queue | Server-authoritative data |

---

## 12. React Hook Form — Form Handling

All forms must use `react-hook-form` paired with Zod via `@hookform/resolvers/zod`.

```tsx
// features/users/components/CreateUserForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateUserSchema, type CreateUserInput } from "@/features/users/schemas/user.schema";
import { useCreateUser } from "@/features/users/hooks/useCreateUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

export function CreateUserForm() {
  const { mutate: createUser, isPending } = useCreateUser();

  const form = useForm<CreateUserInput>({
    resolver:      zodResolver(CreateUserSchema),
    defaultValues: { name: "", email: "", role: "USER" },
  });

  function onSubmit(values: CreateUserInput) {
    createUser(values, { onSuccess: () => form.reset() });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Full name" {...field} />
              </FormControl>
              <FormMessage /> {/* Zod error messages render automatically here */}
            </FormItem>
          )}
        />
        {/* ... other fields */}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create User"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 13. Tailwind CSS + shadcn/ui — Styling

### `lib/utils/cn.ts`

```typescript
// lib/utils/cn.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Wrapping shadcn/ui Components

Never modify files inside `components/ui/` directly. Always extend via wrapper components.

```tsx
// components/shared/AppButton.tsx
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AppButtonProps extends ButtonProps {
  isLoading?: boolean;
}

export function AppButton({
  isLoading, children, className, disabled, ...props
}: AppButtonProps) {
  return (
    <Button
      className={cn("min-w-[120px]", className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
```

### Styling Rules

- Use `cn()` for all conditional Tailwind class logic
- Never write inline `style={{}}` for things achievable with Tailwind
- Avoid custom CSS files unless handling complex animations or native browser overrides
- Never use `!important` — fix specificity issues with `cn()` and `twMerge`
- Adhere to a modern, premium SaaS aesthetic: clean typography, ample whitespace, high contrast

---

## 14. Authentication Architecture

### Token Storage

| Method | Use? | Reason |
|---|---|---|
| HTTP-only cookies | ✅ Yes | Inaccessible to JavaScript — XSS-safe |
| localStorage | ❌ Never | Accessible to JS — XSS-vulnerable |
| sessionStorage | ❌ Never | Same risk as localStorage |
| Zustand | ❌ Never | Lives in browser memory — not secure |

### Auth Flow

```
1. User submits credentials via LoginForm (Client Component)
2. Form calls POST /api/auth/login (Next.js Route Handler)
3. Route Handler forwards to Spring Boot /api/auth/login (with API key)
4. Spring Boot validates and returns JWT tokens
5. Route Handler sets HTTP-only cookie — token NEVER reaches client JS ✅
6. middleware.ts reads the cookie on every protected route request
7. Server Components read auth context server-side for credentialed data fetching
```

### Token Strategy

- **Access Token** — Short-lived (15 min), stored in HTTP-only cookie
- **Refresh Token** — Long-lived (7 days), stored in HTTP-only cookie
- **Token rotation** — Refresh token is rotated on every use
- Never log tokens to the console in any environment

---

## 15. Security Standards

### Mandatory Requirements

| Rule | Implementation |
|---|---|
| HTTPS only | Redirect HTTP to HTTPS in production |
| Security headers | Configure in `next.config.ts` (see below) |
| XSS prevention | Rely on React's default escaping; use DOMPurify if `dangerouslySetInnerHTML` is unavoidable |
| CSRF protection | Include CSRF tokens in mutation requests if required by Spring Boot |
| Input validation | Both client-side (Zod + React Hook Form) and server-side (Spring Boot) |
| No secrets in `NEXT_PUBLIC_` | Enforced by env startup validation |
| No tokens in localStorage | HTTP-only cookies only |
| Rate limiting | Implement on Next.js Route Handlers for auth endpoints |
| No sensitive data in logs | Never log passwords, tokens, secrets, or payment details |

### Security Headers — `next.config.ts`

```typescript
// next.config.ts
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",  value: "on" },
  { key: "X-Frame-Options",         value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",  value: "nosniff" },
  { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
];

export default {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

---

## 16. Middleware — Route Protection

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIX = "/dashboard";
const AUTH_PAGES       = ["/login", "/register"];
const AUTH_COOKIE      = "auth-token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token        = request.cookies.get(AUTH_COOKIE)?.value;

  const isProtected = pathname.startsWith(PROTECTED_PREFIX);
  const isAuthPage  = AUTH_PAGES.includes(pathname);

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL(PROTECTED_PREFIX, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
```

> **Critical:** Never rely solely on client-side redirects for route protection. The middleware runs on the Edge before any page renders — it is the only reliable guard.

---

## 17. Error Handling

### Global API Types — `types/api.types.ts`

```typescript
// types/api.types.ts

export type ApiResponse<T> = {
  data:       T;
  message:    string;
  status:     number;
  timestamp?: string;
};

// Spring Boot includes field-level validation errors in this format
export type ApiErrorResponse = {
  message:    string;
  status:     number;
  errors?:    Record<string, string[]>; // e.g. { "email": ["must not be blank"] }
  timestamp?: string;
};
```

### Global Error Boundary — `app/error.tsx`

```tsx
// app/error.tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold text-destructive">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}
```

### Error Handling Rules

- Never expose Spring Boot stack traces or internal error details to the browser
- Show user-friendly messages; log full errors server-side only
- Every async page must render loading, empty state, and error states
- Use TanStack Query's `isError` and `error` for all client-side error rendering

---

## 18. Performance Standards

- **Dynamic imports** — Use `next/dynamic` for heavy Client Components not needed on first render
- **Image optimization** — Always use `next/image`; never raw `<img>` tags
- **Lazy loading** — Defer non-critical components and content below the fold
- **Pagination** — Never load unbounded lists; use cursor or offset pagination via Spring Boot
- **Memoization** — Use `useMemo` / `useCallback` only when profiling shows a clear need
- **Bundle analysis** — Run `@next/bundle-analyzer` before production deployments
- **Caching** — Use TanStack Query's `staleTime`; use Next.js `cache()` for Server Component data deduplication

---

## 19. Accessibility Standards

All interactive components must meet WCAG 2.1 AA standards:

- Semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<header>`, `<section>`, etc.)
- All images have meaningful `alt` text; decorative images use `alt=""`
- All form fields have associated `<label>` elements or `aria-label`
- Full keyboard navigation for all interactive elements (no mouse traps)
- Focus styles are always visible — never remove with `outline: none` without a replacement
- Minimum color contrast ratio of 4.5:1 for normal text
- `aria-label` or `aria-labelledby` on all icon-only buttons
- Modals trap focus when open and restore focus to the trigger on close

---

## 20. Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `UserCard.tsx`, `AppButton.tsx` |
| Hooks | camelCase + `use` prefix | `useUsers.ts`, `useCreateUser.ts` |
| Zustand stores | camelCase + `.store` suffix | `ui.store.ts`, `auth.store.ts` |
| Zod schemas | PascalCase + `Schema` suffix | `CreateUserSchema`, `LoginSchema` |
| Schema files | camelCase + `.schema` suffix | `user.schema.ts`, `auth.schema.ts` |
| Inferred types | PascalCase | `User`, `CreateUserInput` |
| Type files | camelCase + `.types` suffix | `user.types.ts`, `api.types.ts` |
| Route handlers | `route.ts` in folder | `app/api/users/route.ts` |
| Utility functions | camelCase | `formatDate`, `cn`, `sanitize` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_TIMEOUT` |
| CSS variables | kebab-case | `--color-primary`, `--font-heading` |
| Feature folders | kebab-case | `features/user-management/` |

---

## 21. Import Standards

Always use the `@/` path alias. Never use deep relative imports.

```typescript
// ✅ Correct
import { UserSchema }  from "@/features/users/schemas/user.schema";
import { cn }          from "@/lib/utils/cn";
import { useUIStore }  from "@/store/ui.store";
import { ENDPOINTS }   from "@/lib/api/endpoints";

// ❌ Wrong — fragile, breaks on file moves
import { UserSchema } from "../../../features/users/schemas/user.schema";
```

### Import Order (enforced by ESLint)

1. React and Next.js core imports
2. Third-party library imports
3. Internal `@/` imports (lib, features, components, hooks, store, types)
4. Relative imports — only within the same feature folder
5. Type-only imports (`import type { ... }`)

---

## 22. Code Generation Order (AI Agents)

When building a new feature, always generate in this exact order:

1. **Types** — Define TypeScript types in `features/<name>/types/`
2. **Zod Schema** — Create validation schemas in `features/<name>/schemas/`
3. **Service** — Create the API service function in `features/<name>/services/`
4. **Query Keys** — Define the key factory in `features/<name>/hooks/<name>Keys.ts`
5. **TanStack Query Hooks** — Create query/mutation hooks in `features/<name>/hooks/`
6. **UI Components** — Build the components in `features/<name>/components/`
7. **Page** — Wire everything together in `app/(protected)/<name>/page.tsx`

Additional agent rules:

- Do not output generic placeholder text; use contextually relevant dummy data
- Write comments only for complex logic — never state the obvious
- Strictly avoid `any` — use `unknown` for genuinely dynamic types
- Always define a named interface for component props; do not use `React.FC`
- Use standard function declarations for components, not arrow functions at the module level
- **Before creating any new UI component, check Section 26 for existing reusable components** — reuse first, create only when nothing fits

---

## 23. Recommended Packages

```bash
# Core
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zustand
npm install zod
npm install react-hook-form @hookform/resolvers
npm install axios

# UI & Styling
npm install tailwind-merge clsx
npm install lucide-react

# shadcn/ui (initialize first, then add components as needed)
npx shadcn@latest init
npx shadcn@latest add button input form table dialog select badge

# Security
npm install dompurify @types/dompurify   # Only if dangerouslySetInnerHTML is required

# Dev Tools
npm install -D @next/bundle-analyzer
npm install -D eslint prettier eslint-config-prettier
```

---

## 24. Production Checklist

Before any production deployment, every item must be verified:

- [ ] All environment variables are set, validated, and secured
- [ ] `.env.local` is in `.gitignore` and has never been committed
- [ ] No `NEXT_PUBLIC_` variables contain secrets or credentials
- [ ] All Next.js Route Handlers are authenticated and handle errors correctly
- [ ] HTTPS is enforced; HTTP redirects to HTTPS
- [ ] Security headers are configured in `next.config.ts`
- [ ] Error boundaries (`app/error.tsx`) are in place at every async boundary
- [ ] All forms use Zod validation via React Hook Form
- [ ] All API responses are validated with Zod before use
- [ ] JWT tokens are stored in HTTP-only cookies only — never localStorage
- [ ] Console contains no tokens, passwords, or secrets
- [ ] Bundle has been analyzed — no unexpectedly large client chunks
- [ ] All images use `next/image`
- [ ] Middleware is protecting all protected routes
- [ ] Accessibility tested with keyboard navigation
- [ ] Loading, empty, and error states exist for every async page or component

---

## 25. Do's and Don'ts

### ✅ Always Do

- **Check Section 26 before building any UI** — reuse existing shared components instead of recreating them
- Default to Server Components — add `"use client"` only when genuinely required
- Call Spring Boot with credentials only from Server Components or Route Handlers
- Validate every form input and every API response with a Zod schema
- Use TanStack Query for all server state; Zustand for UI state only
- Store tokens in HTTP-only cookies — never in localStorage or Zustand
- Use `middleware.ts` for route protection on the Edge
- Wrap shadcn/ui components instead of modifying `components/ui/` directly
- Use `cn()` for all conditional Tailwind class logic
- Use `@/` path aliases for all internal imports
- Generate Zod schema first, then infer TypeScript types from it
- Keep feature logic inside its feature folder
- Handle loading, error, and empty states for every async operation

### ❌ Never Do

- Use `NEXT_PUBLIC_` for secrets, API keys, or backend credentials
- Call Spring Boot directly from a Client Component
- Store JWT tokens in `localStorage`, `sessionStorage`, or Zustand
- Skip Zod validation on API responses or outbound mutation data
- Use the `any` type — use `unknown` for genuinely dynamic types
- Modify files inside `components/ui/` directly
- Use `useEffect` for initial data fetching — use Server Components or TanStack Query
- Put business security logic or authorization rules in the frontend
- Place feature-specific code outside its feature folder
- Use inline `style={{}}` for styling achievable with Tailwind
- Log tokens, passwords, or secrets to the console in any environment
- Deploy without completing the production checklist

---

## 26. Figma Design Implementation

When a Figma design is provided for implementation, follow these rules strictly.

### Step 1 — Audit existing components first

Before writing a single line of UI code, check the table below. If an existing component covers the design element (even partially), **use and extend it** — do not create a new one.

### Step 2 — Extend, don't duplicate

If an existing component is close but missing a feature (e.g. a new size, a new color variant), **add the variant to the existing component**. Do not copy-paste it into a new file.

### Step 3 — Only create new components when nothing fits

A new shared component is justified only when the design element has no overlap with anything in the table below. New components go in `components/shared/` (generic) or `components/layout/` (structural).

### Step 4 — Keep this section up to date

Every time a new reusable component is built, add it to the table below so future Figma implementations can find it.

---

### Shared Component Library

#### `components/shared/`

| Component | File | Variants / Props | Use for |
|---|---|---|---|
| `PillButton` | `PillButton.tsx` | `variant`: `"orange"` `"teal"` `"success"` | Full-width pill-shaped action buttons |
| `SlideButton` | `SlideButton.tsx` | `variant`: `"orange"` `"teal"` — always completes to green | Slide-to-confirm interactions |
| `TaskCard` | `TaskCard.tsx` | `description`, `onClose`, `children` | White card with description label + close button |
| `StatusDot` | `StatusDot.tsx` | `variant`: `"active"` `"pending"` `"inactive"` `"error"` · `size`: `"sm"` `"md"` `"lg"` · `showLabel` | Colored status indicator dot |
| `LoadingSpinner` | `LoadingSpinner.tsx` | `size`, `className` | Animated loading indicator |
| `ErrorMessage` | `ErrorMessage.tsx` | `message`, `className` | Inline field or section error text |
| `EmptyState` | `EmptyState.tsx` | `title`, `description`, `action`, `className` | Empty list / zero-data placeholder |
| `ProgressBar` | `ProgressBar.tsx` | `percent`, `className`, `barClassName` | Horizontal progress bar (rankings, inventory stock) |
| `SearchInput` | `SearchInput.tsx` | `value`, `onChange`, `placeholder`, `className` | Icon + text search field used above filter tabs |

#### `components/layout/`

| Component | File | Props | Use for |
|---|---|---|---|
| `BottomNavBar` | `BottomNavBar.tsx` | none — reads active route from `usePathname` | Fixed bottom 5-tab navigation |
| `NavItem` | `BottomNavBar.tsx` (exported) | `item`, `isActive` | Individual nav tab (reuse if building a custom nav) |

---

### Color Variant Reference

All button and indicator components use the same variant names, which map to the design token colors in `globals.css`:

| Variant | Color | Token | Typical use |
|---|---|---|---|
| `"orange"` | `#F97316` | `--color-status-pending` | Start / upload / note actions |
| `"teal"` | `#0B585A` | `--color-primary` | Complete / confirm actions |
| `"success"` | `#27AE60` | `--color-success` | Completed / done state |
| `"active"` | `#27AE60` | `--color-status-active` | Active / online status dots |
| `"pending"` | `#F97316` | `--color-status-pending` | In-progress / busy status dots |
| `"inactive"` | `#9E9E9E` | `--color-status-inactive` | Offline / not-started status dots |
| `"error"` | `#B00020` | `--color-error` | Error / failed status dots |
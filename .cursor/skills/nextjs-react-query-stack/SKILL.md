---
name: nextjs-react-query-stack
description: Use TanStack React Query, zustand, axios, date-fns, and related patterns in Next.js. Use when building data fetching, server state, client state, API clients, or date/time handling in Next.js apps.
---

# Next.js + React Query, zustand, axios, date-fns

## Stack (this project)

- **TanStack React Query** v5 — server state, caching, mutations
- **zustand** — client state (UI state, small stores)
- **axios** — HTTP client (optional; project may use Supabase/fetch instead)
- **date-fns** — date formatting, parsing, arithmetic
- **Next.js** 16 — App Router or Pages Router

---

## TanStack React Query (v5)

### Provider (Pages Router)

Wrap the app with `QueryClientProvider`. Create the client once (e.g. in `_app.tsx`):

```tsx
// _app.tsx or similar
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5 }, // 5 min default
  },
})

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}
```

### Query keys

Use array query keys; include all variables that affect the data. Export constants for reuse in mutations.

```ts
const PATIENTS_QUERY_KEY = ['patients']
const VISIT_QUERY_KEY = (date: string) => ['visits', date]
```

### Queries

Keep `queryFn` thin: call a service/API layer, not inline fetch. Prefer `staleTime` over refetch-on-mount when data is stable.

```ts
import { useQuery } from '@tanstack/react-query'

export function usePatientsQuery() {
  return useQuery({
    queryKey: PATIENTS_QUERY_KEY,
    queryFn: () => patientsApi.getAll(),
    staleTime: 1000 * 60 * 5,
  })
}
```

### Mutations + invalidation

Invalidate related queries in `onSuccess` so lists update. Use `queryClient.invalidateQueries({ queryKey })`; avoid over-invalidating (e.g. invalidate only the list that changed).

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patient: CreatePatientRequest) => patientsApi.create(patient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY })
    },
  })
}
```

### In components

Use `data`, `isLoading`, `isError`, `error`; for mutations use `mutate`/`mutateAsync` and `isPending`. Prefer one source of truth: if data comes from React Query, don’t duplicate it in local state.

---

## zustand

Use for client-only state (filters, modals, sidebar open, etc.). Don’t put server data in zustand; use React Query for that.

### Store shape

Keep stores small. Use `create` with a single object; optionally use `persist` for things that should survive refresh (e.g. theme, sidebar collapsed).

```ts
import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
```

### Selectors

Select only what the component needs to avoid unnecessary re-renders.

```ts
const sidebarOpen = useUIStore((s) => s.sidebarOpen)
const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
```

### With Next.js

Stores are client-only. Use them in Client Components; if you need initial state from the server, pass it as props and call `setState` in a `useEffect` or hydrate from `getServerSideProps`/server component.

---

## axios

When the project uses axios (not Supabase/fetch), use a single instance with base URL and interceptors.

### Instance

```ts
// lib/axios.ts or services/axios.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAuthToken() // from cookie, localStorage, or context
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // redirect to login or refresh
    }
    return Promise.reject(err)
  }
)
```

### With React Query

Use the axios instance in `queryFn`/`mutationFn`; keep hooks in `hooks/` and API calls in `services/` or `lib/`.

```ts
queryFn: async () => {
  const { data } = await api.get('/patients')
  return data
}
```

---

## date-fns

Use for parsing, formatting, and arithmetic. Prefer ISO strings for API/DB; use date-fns in the UI and in business logic.

### Common imports

```ts
import { format, parseISO, addDays, subDays, isSameDay, startOfDay, endOfDay } from 'date-fns'
```

### Formatting (display)

```ts
format(new Date(), 'yyyy-MM-dd')           // input[type="date"] value
format(date, 'EEEE, MMMM d, yyyy')         // long date
format(date, 'h:mm a')                     // 2:30 PM
format(date, 'HH:mm')                      // 24h
```

### Parsing

API/DB often returns ISO strings. Parse for display or comparison:

```ts
parseISO('2025-02-10')                     // date-only
parseISO(`${record.scheduled_date}T${record.scheduled_time}`)  // date + time
```

### Comparisons and ranges

```ts
isSameDay(d1, d2)
const start = startOfDay(selectedDate)
const end = endOfDay(selectedDate)
```

### Time zones

date-fns is local-time by default. For UTC or specific zones, use `date-fns-tz` or handle offset in the API layer.

---

## Other common packages (this project)

- **sonner** — Toasts: `<Toaster />` in layout; `toast.success('Done')` / `toast.error('Failed')`
- **framer-motion** — Animations: `motion.div`, `AnimatePresence` for enter/exit
- **lucide-react** — Icons: `<Calendar />`, `<User />`, etc.

---

## File layout (suggested)

- `hooks/useXQuery.ts`, `hooks/useXMutation.ts` — React Query hooks; call services, define query keys
- `services/api/*.ts` — API functions (Supabase, axios, or fetch); no hooks
- `lib/axios.ts` or `lib/api.ts` — axios instance if used
- `stores/*.ts` — zustand stores
- Keep query key constants next to the hooks that use them or in a shared `queryKeys.ts`

---

## Quick reference

| Need | Use |
|------|-----|
| Server/list data, caching | React Query `useQuery` |
| Create/update/delete | React Query `useMutation` + invalidate |
| UI state (filters, modals) | zustand |
| HTTP with auth/retries | axios instance + interceptors |
| Date display/input | date-fns `format` / `parseISO` |
| Date math | date-fns `addDays`, `startOfDay`, etc. |
| Toasts | sonner |
| Animations | framer-motion |

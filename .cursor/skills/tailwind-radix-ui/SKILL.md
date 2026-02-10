---
name: tailwind-radix-ui
description: Style UIs with Tailwind CSS and Radix UI primitives. Use when building or styling components, using Tailwind utilities, Radix primitives (Dialog, Select, Toast, Label, Slot), class-variance-authority (cva), framer-motion animations, tailwindcss-animate, or the project's cn()/design tokens.
---

# Tailwind + Radix UI

## Stack (this project)

- **Tailwind** 3.x with `tailwind-merge`, `tailwindcss-animate`
- **Radix** primitives: Dialog, Label, Select, Slot, Toast
- **Animations**: `framer-motion` (motion components, AnimatePresence, variants), `tailwindcss-animate` (CSS animate-in/out)
- **Styling**: `class-variance-authority` (cva), `clsx`, `tailwind-merge` via `cn()` from `@/lib/utils`
- **Theming**: CSS variables in `globals.css` (e.g. `--background`, `--primary`, `--ring`, `--radius`)

## Class names: always use `cn()`

Merge and dedupe classes with `cn()` so overrides and conditionals work correctly:

```tsx
import { cn } from "@/lib/utils"

// Simple
<div className={cn("flex gap-2", className)} />

// With conditionals
<div className={cn("base classes", isActive && "active", className)} />

// With cva (see below)
<button className={cn(buttonVariants({ variant, size }), className)} />
```

Do not concatenate class strings manually; use `cn()` (which uses `clsx` + `tailwind-merge`).

## Component variants: use cva

Use `class-variance-authority` for variant-based components. Export both the component and the variants for reuse (e.g. combining with Radix).

```tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
Button.displayName = "Button"
export { Button, buttonVariants }
```

Pass `className` into `cva(..., { variant, size, className })` so callers can override.

## Design tokens (Tailwind)

Prefer semantic tokens that map to CSS variables so light/dark and theming stay consistent:

| Use | Token |
|-----|--------|
| Page/content background | `bg-background`, `text-foreground` |
| Cards, panels | `bg-card text-card-foreground`, `border-border` |
| Primary actions | `bg-primary text-primary-foreground`, `hover:bg-primary/90` |
| Secondary/muted | `bg-secondary`, `bg-muted`, `text-muted-foreground` |
| Destructive | `bg-destructive text-destructive-foreground` |
| Inputs, borders | `border-input`, `ring-ring` |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background` |
| Border radius | `rounded-md` or use `--radius` if exposed as utility |

Avoid hardcoding colors (e.g. `bg-blue-500`) for UI chrome; use tokens so dark mode and future themes work.

## Radix primitives

- **Styling**: Radix parts accept `className`. Use `cn()` to apply Tailwind and merge with `className` prop.
- **Composition**: Use `asChild` and `@radix-ui/react-slot` when the component should render as its child (e.g. `Button asChild` wrapping a link). The child receives the merged props and classes.
- **Refs**: Use `React.forwardRef` and `React.ElementRef<typeof Primitive.Root>` so refs forward correctly to the underlying DOM node.
- **Props**: Spread `...props` and type with `React.ComponentPropsWithoutRef<typeof Primitive.Root>` so Radix props (e.g. `onOpenChange`) are supported.

Pattern for wrapping a Radix primitive with variants:

```tsx
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70")

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
))
Label.displayName = LabelPrimitive.Root.displayName
export { Label }
```

## Tailwind usage

- **Responsive**: `sm:`, `md:`, `lg:` etc. Mobile-first; base = mobile.
- **State**: `hover:`, `focus:`, `focus-visible:`, `disabled:`, `active:`, `peer-disabled:` for form relationships.
- **Layout**: Prefer `flex`/`grid` with `gap`; avoid margin for spacing between items when flex/grid gap works.

## Animations

### Framer Motion

- **Import**: `import { motion, AnimatePresence } from 'framer-motion'`
- **Variants**: Use shared variants from `@/lib/animations` so timing and easing stay consistent. That file exports: `pageVariants`, `fadeIn`, `slideUp`, `scaleIn`, `staggerContainer`, `staggerItem`, `mobileFadeIn`, `mobileSlideUp`. All are typed as `Variants` from framer-motion.
- **Pattern**: Use `initial="initial"` / `animate="animate"` / `exit="exit"` with `variants={...}`. For list stagger: parent gets `variants={staggerContainer}`, children get `variants={staggerItem}`.
- **Page/route transitions**: Wrap content in `PageTransition` from `@/components/animations/PageTransition` (uses `pageVariants`). Use `AnimatePresence` with a `key` (e.g. `key={router.asPath}`) when wrapping route content so exit runs.
- **Simple fade**: Use `FadeIn` from `@/components/animations/FadeIn` or apply `fadeIn`/`slideUp` via `motion.div` + variants.
- **Modals/overlays**: Use `scaleIn` from `@/lib/animations` for enter/exit.
- **Reduced motion**: Prefer `mobileFadeIn` / `mobileSlideUp` (shorter, less movement) when targeting mobile or when respecting `prefers-reduced-motion` (you can gate with a hook or prop).

Example (stagger list, matching dashboard/invoices pattern):

```tsx
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/lib/animations'

<motion.div variants={staggerContainer} initial="initial" animate="animate" className="...">
  {items.map((item) => (
    <motion.div key={item.id} variants={staggerItem}>
      {/* ... */}
    </motion.div>
  ))}
</motion.div>
```

### tailwindcss-animate

- Use for CSS-only effects where a class is enough: `animate-in`, `animate-out`, `fade-in`, `slide-in-from-*`, etc. Prefer these for small UI details (dropdowns, tooltips) when you don’t need orchestration or exit animations.
- For enter+exit and list staggers, use framer-motion and `@/lib/animations`.

## Anti-patterns

- Do not build one-off “styled” wrappers that only add a fixed `className`; use `cn(..., className)` and forward `className` so callers can override.
- Do not use arbitrary values (e.g. `w-[137px]`) when a semantic token or standard scale exists.
- Do not forget `focus-visible:outline-none` and `focus-visible:ring-*` on interactive elements for keyboard focus.
- When using Radix, do not replace the primitive’s DOM structure for styling if it breaks accessibility; style via `className` on the parts Radix exposes.
- For animations: prefer variants from `@/lib/animations` and components from `@/components/animations` instead of defining new inline variants with different timings.

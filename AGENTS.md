---
description: Standards for building frontend features in the SaaS Pharmacy Management app
globs: src/features/**/*.tsx, src/features/**/*.ts
alwaysApply: true
---

# Frontend Feature Standards

## 1 — UI Components: always use `src/app/components/ui/`

Never write raw HTML `<button>`, `<input>`, `<select>`, `<textarea>`, `<label>`, `<table>`, `<dialog>`, or `<badge>` elements directly in a feature page or component.

Always import from `@/app/components/ui/`:

```tsx
// ✅ correct
import { Button }   from "@/app/components/ui/button";
import { Input }    from "@/app/components/ui/input";
import { Label }    from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
                    from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter }
                    from "@/app/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }
                    from "@/app/components/ui/table";
import { Badge }    from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle }
                    from "@/app/components/ui/card";

// ❌ never
<button className="...">Save</button>
<input type="text" className="..." />
```

Available components (all under `@/app/components/ui/`):
`accordion`, `alert`, `alert-dialog`, `avatar`, `badge`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input`, `input-otp`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`

---

## 2 — i18n: zero hardcoded strings

Every string visible to the user **must** come from `useLanguage()`.

```tsx
// ✅ correct
import { useLanguage } from "@/app/contexts/useLanguage";

export function MyFeaturePage() {
  const { t, language, direction } = useLanguage();
  return <h1>{t("myFeature:header.title")}</h1>;
}
```

Rules:

- Keys use the format `namespace:section.key` (e.g. `adminTenants:table.empty`).
- Each feature has a dedicated namespace JSON file at:
  - `src/i18n/locales/en/<namespace>.json`
  - `src/i18n/locales/ar/<namespace>.json`
- Both files must be kept in sync — every key present in `en` must exist in `ar`.
- Register the namespace in `src/i18n/config/i18n.ts` (import + add to `resources` + add to `ns` array).
- For RTL-aware layouts, use `direction === "rtl"` from `useLanguage()`.
- For locale-aware dates, use `language === "ar" ? "ar-EG" : "en-US"`.

```tsx
// ❌ never
<h1>Feature Overrides</h1>;
toast.success("Saved!");
```

---

## 3 — Forms: always use `react-hook-form`

All forms must use `react-hook-form`. Never manage form state manually with `useState` per field.

```tsx
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

interface FormValues {
  name: string;
  email: string;
}

function MyForm({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const form = useForm<FormValues>({ defaultValues: { name: "", email: "" } });

  const onSubmit = (values: FormValues) => {
    /* call mutation */
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: t("common:validation.required") }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("myFeature:modal.fields.name.label")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("myFeature:modal.fields.name.placeholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-500 text-[10px]" />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("myFeature:modal.actions.cancel")}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {t("myFeature:modal.actions.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

Error message style is always enforced by `<FormMessage className="text-red-500 text-[10px]" />` — never inline.

---

## 4 — File structure: split pages into components

A page file (`pages/MyPage.tsx`) must not contain all UI inline. Extract each logical section into its own file under `features/<feature>/components/`.

```
src/features/admin/tenants/
  pages/
    TenantsPage.tsx          ← orchestration only: hooks, state, layout
    TenantDetailsPage.tsx
  components/
    CreateTenantModal.tsx    ← one concern per file
    TenantStatusBadge.tsx
    TenantActionsMenu.tsx
    TenantOverviewTab.tsx
    TenantSubscriptionTab.tsx
    TenantInvoicesTab.tsx
  api/                       ← types + hooks (see rule 5)
```

A page file should only:

1. Call query/mutation hooks.
2. Hold top-level UI state (open modal, selected filter).
3. Render the layout grid, passing data and handlers down to components.

If a JSX block is longer than ~60 lines, extract it.

---

## 5 — Types: define in `api/` and share across the feature

All entity types and API payload interfaces live in `src/features/<feature>/api/` and are exported from the feature's `api/index.ts`.

```
src/features/admin/api/
  platform.types.ts    ← interfaces, types, enums
  platform.hooks.ts    ← useQuery / useMutation hooks (import types from .types)
  index.ts             ← export * from "./platform.types"; export * from "./platform.hooks";
```

Rules:

- Never redeclare a type that already exists in `api/`.
- Never import from `platform.types.ts` directly in a page — always go through the barrel `api/index.ts`.
- Payload interfaces belong in `.types.ts`, not inline in a hook or component.

```tsx
// ✅ correct
import { type Tenant, useTenantsQuery } from "@/features/admin/api";

// ❌ never — type re-declared locally
interface Tenant {
  id: string;
  name: string;
}
```

---

## 6 — Loading states: use shared skeletons

Never use a raw spinner or `<p>Loading…</p>` for loading states.

| Situation                 | Component                                |
| ------------------------- | ---------------------------------------- |
| Table / list data loading | `<TableSkeleton columns={N} rows={N} />` |
| Card / stat grid loading  | `<CardSkeleton />` (repeat inside grid)  |

```tsx
import TableSkeleton from "@/shared/components/TableSkeleton";
import CardSkeleton from "@/shared/components/CardSkeleton";

// Table loading
if (isLoading) return <TableSkeleton columns={6} rows={8} />;

// Card grid loading
if (isLoading)
  return (
    <div className="grid grid-cols-4 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
```

For empty results, use `<EmptyState icon={SomeIcon} heading={t("...")} subline={t("...")} />` from `@/shared/components/EmptyState`.

## 7 — Don't ever add this symbol "—" in text if you need a separator add "-" and if text separate add ","

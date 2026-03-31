# Policy Manager — Frontend UI Reference
> **Read this entire file before generating ANY frontend code.**
> This is the single source of truth for design, components, interactions, and patterns.
> Stack: Next.js 14 App Router · TypeScript · Tailwind CSS · TanStack Query · Zustand · react-hook-form · zod · lucide-react · sonner

---

## DESIGN INSPIRATION SOURCES
The UI is inspired by and should match the quality of:
- **Linear** (linear.app) — sidebar, keyboard nav, clean typography, hover states
- **Camunda** (camunda.com) — BRE/workflow rule management patterns, approval flows
- **Retool** (retool.com) — enterprise data table, split-panel layouts
- **Mambu** (mambu.com) — banking SaaS feel, stat cards, policy management
- **Vercel** (vercel.com/dashboard) — template picker, status badges, deployment-style timelines
- **Metabase** (metabase.com) — simulation/query panel, filter bar patterns

---

## 1. DESIGN TOKENS

### 1.1 Color System

```ts
// tailwind.config.ts — ALWAYS use these tokens, never raw Tailwind colors
theme: {
  extend: {
    colors: {

      // ── Brand (Indigo) ────────────────────────────────────────────────
      brand: {
        25:  '#F5F3FF',   // very subtle bg tint
        50:  '#EEF2FF',   // sidebar active bg, selected card bg
        100: '#E0E7FF',   // hover on brand-50
        200: '#C7D2FE',   // focus ring offset
        500: '#6366F1',   // logo, chat FAB, primary accent, selected border
        600: '#4F46E5',   // sidebar active text, primary buttons, links
        700: '#4338CA',   // hover on brand-600
        800: '#3730A3',   // active press state
      },

      // ── Surface & Neutrals ────────────────────────────────────────────
      // Source: Linear's surface system
      surface: {
        page:    '#F8FAFC',   // main content background (slate-50)
        card:    '#FFFFFF',   // card, panel, modal bg
        raised:  '#F1F5F9',   // table row hover, input bg, subtle section bg
        overlay: '#0F172A80', // modal backdrop (50% opacity)
      },

      // ── Text ──────────────────────────────────────────────────────────
      ink: {
        900: '#0F172A',   // primary headings (slightly darker than before)
        700: '#334155',   // body text
        500: '#64748B',   // secondary, labels, placeholders
        300: '#CBD5E1',   // disabled text, muted icons
        200: '#E2E8F0',   // borders, dividers
      },

      // ── Status — Policy Lifecycle ─────────────────────────────────────
      // Source: Camunda + Linear status patterns
      status: {
        draft:            { DEFAULT: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
        pending_review:   { DEFAULT: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
        under_review:     { DEFAULT: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
        changes_requested:{ DEFAULT: '#B45309', bg: '#FEF3C7', border: '#FCD34D' },
        approved:         { DEFAULT: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
        published:        { DEFAULT: '#0D9488', bg: '#F0FDFA', border: '#99F6E4' },
        rejected:         { DEFAULT: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
      },

      // ── Audit Event Colors ────────────────────────────────────────────
      // Source: Vercel deployment timeline
      event: {
        submitted: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
        updated:   { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6' },
        approved:  { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
        rejected:  { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
        created:   { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
        published: { bg: '#F0FDFA', text: '#0F766E', dot: '#14B8A6' },
        reverted:  { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
      },

      // ── BRE Rule Result Colors ────────────────────────────────────────
      bre: {
        pass:    { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC' },
        fail:    { bg: '#FEF2F2', text: '#B91C1C', border: '#FCA5A5' },
        warn:    { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' },
        skipped: { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' },
      },

      // ── Template Category Colors ──────────────────────────────────────
      // Source: Vercel template gallery
      category: {
        retail:   { accent: '#3B82F6', bg: '#EFF6FF' },
        business: { accent: '#10B981', bg: '#ECFDF5' },
        msme:     { accent: '#8B5CF6', bg: '#F5F3FF' },
        home:     { accent: '#F97316', bg: '#FFF7ED' },
        gold:     { accent: '#F59E0B', bg: '#FFFBEB' },
        vehicle:  { accent: '#6B7280', bg: '#F9FAFB' },
        blank:    { accent: '#6366F1', bg: '#EEF2FF' },
      },
    },

    // ── Font ──────────────────────────────────────────────────────────────
    // Source: Linear uses Inter, Retool uses Inter — both production proven
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },

    // ── Border radius ─────────────────────────────────────────────────────
    borderRadius: {
      sm:   '6px',
      DEFAULT: '8px',
      md:   '10px',
      lg:   '12px',
      xl:   '16px',
      '2xl':'20px',
      full: '9999px',
    },

    // ── Box shadows ───────────────────────────────────────────────────────
    // Source: Linear's subtle shadow system
    boxShadow: {
      xs:     '0 1px 2px rgba(0,0,0,0.04)',
      sm:     '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      md:     '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
      lg:     '0 10px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
      xl:     '0 20px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)',
      modal:  '0 25px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)',
      focus:  '0 0 0 3px rgba(99,102,241,0.25)',
      none:   'none',
    },
  }
}
```

### 1.2 Typography Scale

```ts
// ALWAYS use these — never write raw font-size values
const type = {
  // Display
  display:     'text-4xl font-bold tracking-tight text-ink-900',        // 36px — hero/empty state
  h1:          'text-[30px] font-bold tracking-tight text-ink-900',     // 30px — page titles
  h2:          'text-xl font-semibold text-ink-900',                    // 20px — section titles
  h3:          'text-base font-semibold text-ink-900',                  // 16px — card titles
  h4:          'text-sm font-semibold text-ink-900',                    // 14px — subsection

  // Body
  bodyLg:      'text-base text-ink-700 leading-relaxed',               // 16px
  body:        'text-sm text-ink-700 leading-relaxed',                 // 14px
  bodySm:      'text-xs text-ink-500 leading-relaxed',                 // 12px

  // UI elements
  label:       'text-sm font-medium text-ink-700',                     // form labels
  labelSm:     'text-xs font-medium text-ink-500',                     // small labels
  overline:    'text-[11px] font-semibold uppercase tracking-widest text-ink-500', // "PLATFORM"
  caption:     'text-[11px] text-ink-300',                             // timestamps, meta
  mono:        'text-xs font-mono text-ink-500',                       // IDs, versions

  // Table
  tableHead:   'text-xs font-semibold text-ink-500 uppercase tracking-wider',
  tableCell:   'text-sm text-ink-700',
  tableCellSm: 'text-xs text-ink-500',
}
```

### 1.3 Spacing Tokens

```
──────────────────────────────────────────────────
LAYOUT
Sidebar width (expanded):    260px
Sidebar width (collapsed):   64px
Top bar height:              56px
Page padding:                px-10 py-8  (40px horizontal, 32px vertical)
Content max-width:           1280px
──────────────────────────────────────────────────
COMPONENTS
Card padding:                p-6  (24px)
Card gap in grid:            gap-4 (16px)
Section gap:                 space-y-8 (32px)
Table cell:                  px-4 py-3
Input height:                h-10 (40px)
Button sm:                   h-8 px-3
Button default:              h-10 px-4
Button lg:                   h-11 px-5
Icon button:                 h-8 w-8
──────────────────────────────────────────────────
BORDER RADIUS
Card:                        rounded-xl  (12px)
Input / Button:              rounded-lg  (8px)  
Badge (pill):                rounded-full
Badge (square):              rounded  (4px)
Avatar:                      rounded-full
Icon container:              rounded-lg or rounded-xl
Modal:                       rounded-2xl (20px)
──────────────────────────────────────────────────
```

### 1.4 Animation & Transitions

```ts
// Source: Linear's micro-interaction feel — fast and purposeful
const transitions = {
  fast:    'transition-all duration-100 ease-out',   // hover states
  default: 'transition-all duration-150 ease-out',   // most UI interactions
  slow:    'transition-all duration-300 ease-out',   // modals, drawers sliding in
  spring:  'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]', // bouncy modals
}

// Skeleton shimmer animation
// Add to globals.css:
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.animate-shimmer {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## 2. LAYOUT SYSTEM

### 2.1 App Shell

```
┌──────────────────────────────────────────────────────────────────────┐
│ SIDEBAR 260px │ TOPBAR 56px — breadcrumb + page actions + user avatar│
│               ├──────────────────────────────────────────────────────│
│  [Logo]       │                                                       │
│  [PLATFORM]   │  PAGE TITLE                                          │
│               │  page subtitle                                        │
│  Overview     │                                                       │
│  Versions     │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  Audit Log    │  │ StatCard │  │ StatCard │  │ StatCard │          │
│  Simulation   │  └──────────┘  └──────────┘  └──────────┘          │
│  My Policies  │                                                       │
│  Create Policy│  ┌──────────────────────────────────────────────────┐│
│               │  │  POLICY TABLE                                    ││
│               │  │  [search] [filters] [date]         [+ New]      ││
│  ─────────── │  │  ───────────────────────────────────────────── ││
│  [User]       │  │  rows...                                        ││
│  [MAKER]      │  └──────────────────────────────────────────────────┘│
│  Logout       │                                                       │
└───────────────┴───────────────────────────────────────────────────────┘
```

```tsx
// app/policy/layout.tsx
export default function PolicyLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  return (
    <div className="flex h-screen bg-surface-page overflow-hidden font-sans antialiased">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1280px] mx-auto px-10 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

### 2.2 Sidebar

**Inspired by Linear's sidebar — clean grouping, subtle active state, smooth collapse**

```tsx
// Sidebar structure
<aside className={cn(
  "flex flex-col h-full bg-white border-r border-ink-200 transition-all duration-200",
  collapsed ? "w-16" : "w-[260px]"
)}>

  {/* ── Logo ── */}
  <div className="flex items-center gap-3 h-14 px-4 border-b border-ink-200 flex-shrink-0">
    <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
      <ShieldCheckIcon className="w-4 h-4 text-white" />
    </div>
    {!collapsed && (
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-ink-900 truncate">Policy Manager</p>
        <p className="text-[10px] text-ink-300 uppercase tracking-wider">Enterprise</p>
      </div>
    )}
    <button
      onClick={onToggle}
      className="p-1 rounded-md hover:bg-surface-raised text-ink-300 hover:text-ink-700 transition-colors"
    >
      {collapsed ? <PanelRightIcon className="w-4 h-4" /> : <PanelLeftIcon className="w-4 h-4" />}
    </button>
  </div>

  {/* ── Nav ── */}
  <div className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
    {!collapsed && (
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-300 px-3 pb-2">
        Platform
      </p>
    )}
    {navItems.map(item => <NavItem key={item.href} item={item} collapsed={collapsed} />)}
  </div>

  {/* ── User ── */}
  <div className="flex-shrink-0 border-t border-ink-200 p-2">
    <div className={cn(
      "flex items-center gap-3 p-2 rounded-lg hover:bg-surface-raised cursor-pointer transition-colors group",
      collapsed && "justify-center"
    )}>
      <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
        {user.name.charAt(0)}
      </div>
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink-900 truncate">{user.name}</p>
          <RoleBadge role={user.role} />
        </div>
      )}
    </div>
    {!collapsed && (
      <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-ink-500 hover:text-ink-900 hover:bg-surface-raised transition-colors mt-1">
        <LogOutIcon className="w-3.5 h-3.5" />
        Sign out
      </button>
    )}
  </div>
</aside>

// NavItem component
function NavItem({ item, collapsed }) {
  const isActive = usePathname().startsWith(item.href)
  return (
    <Link href={item.href}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
        collapsed ? "justify-center" : "",
        isActive
          ? "bg-brand-50 text-brand-600"
          : "text-ink-500 hover:text-ink-900 hover:bg-surface-raised"
      )}>
        <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-brand-600" : "text-ink-400 group-hover:text-ink-700")} />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </div>
    </Link>
  )
}
```

**Nav items with badges:**
```ts
const navItems = [
  { label: 'Overview',       href: '/policy',            icon: LayoutDashboardIcon },
  { label: 'Versions',       href: '/policy/versions',   icon: GitBranchIcon },
  { label: 'Audit Log',      href: '/policy/audit',      icon: ClipboardListIcon },
  { label: 'Simulation',     href: '/policy/simulation', icon: FlaskConicalIcon },
  { label: 'My Policies',    href: '/policy/mine',       icon: FolderIcon },
  { label: 'Create Policy',  href: '/policy/create',     icon: FilePlusIcon },
  // Role-gated:
  { label: 'Approval Queue', href: '/policy/queue',      icon: InboxIcon, badge: '4', roles: ['CHECKER','APPROVER','ADMIN'] },
]
```

### 2.3 Top Bar

**Inspired by Linear's top bar — breadcrumb + actions + avatar**

```tsx
<header className="h-14 border-b border-ink-200 bg-white flex items-center px-6 gap-4 flex-shrink-0">
  {/* Breadcrumb */}
  <Breadcrumb />

  <div className="flex-1" />

  {/* Global search — Cmd+K */}
  <button className="flex items-center gap-2 h-8 px-3 rounded-lg border border-ink-200 text-ink-500 text-xs hover:border-ink-300 transition-colors">
    <SearchIcon className="w-3.5 h-3.5" />
    <span>Search...</span>
    <kbd className="ml-2 text-[10px] font-mono bg-surface-raised px-1 rounded">⌘K</kbd>
  </button>

  {/* Notifications */}
  <button className="relative h-8 w-8 rounded-lg hover:bg-surface-raised flex items-center justify-center text-ink-500 hover:text-ink-900 transition-colors">
    <BellIcon className="w-4 h-4" />
    <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
  </button>

  {/* User avatar */}
  <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
    {user.name.charAt(0)}
  </div>
</header>
```

### 2.4 Page Header Pattern

**Use this pattern on EVERY screen — consistent across all pages**

```tsx
// components/layout/PageHeader.tsx
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode   // top-right action buttons
}

<div className="flex items-start justify-between mb-8">
  <div>
    <h1 className="text-[30px] font-bold tracking-tight text-ink-900">{title}</h1>
    {subtitle && <p className="text-sm text-ink-500 mt-1">{subtitle}</p>}
  </div>
  {actions && <div className="flex items-center gap-3 mt-1">{actions}</div>}
</div>
```

### 2.5 Breadcrumb

```tsx
// Auto-generates from route
// Overview → nothing
// Overview > Audit Log → "Audit Log"
// Overview > Small Business Loan > Edit → clickable chain

<nav className="flex items-center gap-1.5 text-sm">
  <Link href="/policy" className="text-ink-500 hover:text-ink-900 transition-colors">Overview</Link>
  {segments.map((seg, i) => (
    <Fragment key={seg.href}>
      <ChevronRightIcon className="w-3.5 h-3.5 text-ink-300" />
      {i === segments.length - 1
        ? <span className="text-ink-900 font-medium">{seg.label}</span>
        : <Link href={seg.href} className="text-ink-500 hover:text-ink-900 transition-colors">{seg.label}</Link>
      }
    </Fragment>
  ))}
</nav>
```

---

## 3. COMPONENTS

### 3.1 StatCard

**Inspired by Mambu's dashboard — 4-card grid, trend indicator, sparkline-ready**

```tsx
interface StatCardProps {
  title:    string
  value:    number | string
  delta?:   string          // "+2.5% vs last month"
  deltaDir?:'up' | 'down' | 'neutral'
  icon:     React.ReactNode
  variant:  'success' | 'warning' | 'info' | 'purple' | 'neutral'
  loading?: boolean
  onClick?: () => void
}

const variantMap = {
  success: { card: 'bg-green-50 border-green-100',   icon: 'text-green-600',  delta: 'text-green-600' },
  warning: { card: 'bg-amber-50 border-amber-100',   icon: 'text-amber-600',  delta: 'text-amber-600' },
  info:    { card: 'bg-blue-50 border-blue-100',     icon: 'text-blue-600',   delta: 'text-blue-600'  },
  purple:  { card: 'bg-violet-50 border-violet-100', icon: 'text-violet-600', delta: 'text-violet-600'},
  neutral: { card: 'bg-white border-ink-200',        icon: 'text-ink-500',    delta: 'text-ink-500'   },
}

// Full component
<div
  className={cn(
    "rounded-xl border p-6 cursor-default transition-shadow hover:shadow-md",
    variantMap[variant].card,
    onClick && "cursor-pointer"
  )}
  onClick={onClick}
>
  <div className="flex items-center justify-between mb-4">
    <p className="text-sm font-medium text-ink-500">{title}</p>
    <div className={cn("p-2 rounded-lg", variantMap[variant].card)}>
      <span className={variantMap[variant].icon}>{icon}</span>
    </div>
  </div>

  {loading ? (
    <div className="space-y-2">
      <div className="h-8 w-20 animate-shimmer rounded-lg" />
      <div className="h-4 w-28 animate-shimmer rounded" />
    </div>
  ) : (
    <>
      <p className="text-3xl font-bold text-ink-900 tabular-nums">{value}</p>
      {delta && (
        <div className="flex items-center gap-1 mt-2">
          {deltaDir === 'up'   && <TrendingUpIcon   className="w-3.5 h-3.5 text-green-500" />}
          {deltaDir === 'down' && <TrendingDownIcon className="w-3.5 h-3.5 text-red-500" />}
          <p className={cn("text-xs font-medium", variantMap[variant].delta)}>{delta}</p>
        </div>
      )}
    </>
  )}
</div>

// Overview uses 4 cards:
// [Active Policies - success] [Pending Approval - warning] [Drafts - neutral] [Published - info]
```

### 3.2 StatusBadge

**Inspired by Linear's issue status — dot indicator + label**

```tsx
type PolicyStatus =
  | 'Draft' | 'Pending Review' | 'Under Review'
  | 'Changes Requested' | 'Approved' | 'Published' | 'Rejected'

const statusConfig: Record<PolicyStatus, { classes: string; dot: string }> = {
  'Draft':              { classes: 'bg-slate-100 text-slate-600 border-slate-200',   dot: 'bg-slate-400' },
  'Pending Review':     { classes: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-400' },
  'Under Review':       { classes: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-400'  },
  'Changes Requested':  { classes: 'bg-yellow-50 text-yellow-800 border-yellow-200', dot: 'bg-yellow-400'},
  'Approved':           { classes: 'bg-green-50 text-green-700 border-green-200',    dot: 'bg-green-500' },
  'Published':          { classes: 'bg-teal-50 text-teal-700 border-teal-200',       dot: 'bg-teal-500'  },
  'Rejected':           { classes: 'bg-red-50 text-red-700 border-red-200',          dot: 'bg-red-500'   },
}

export function StatusBadge({ status, size = 'sm' }: { status: PolicyStatus; size?: 'xs' | 'sm' | 'md' }) {
  const config = statusConfig[status]
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 font-semibold border rounded-full",
      size === 'xs' && "px-2 py-0.5 text-[10px]",
      size === 'sm' && "px-2.5 py-0.5 text-xs",
      size === 'md' && "px-3 py-1 text-sm",
      config.classes,
    )}>
      <span className={cn("rounded-full flex-shrink-0", config.dot,
        size === 'xs' && "w-1 h-1",
        size === 'sm' && "w-1.5 h-1.5",
        size === 'md' && "w-2 h-2",
      )} />
      {status}
    </span>
  )
}
```

### 3.3 RoleBadge

```tsx
const roleConfig = {
  MAKER:    { bg: 'bg-ink-900',    text: 'text-white' },
  CHECKER:  { bg: 'bg-blue-600',   text: 'text-white' },
  APPROVER: { bg: 'bg-violet-600', text: 'text-white' },
  ADMIN:    { bg: 'bg-rose-600',   text: 'text-white' },
}

export function RoleBadge({ role }: { role: keyof typeof roleConfig }) {
  const config = roleConfig[role] ?? { bg: 'bg-ink-700', text: 'text-white' }
  return (
    <span className={cn(
      "inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest",
      config.bg, config.text
    )}>
      {role}
    </span>
  )
}
```

### 3.4 PolicyTable

**Inspired by Retool's data table + Linear's list — sortable, filterable, bulk actions**

```tsx
// Filter bar
<div className="flex items-center gap-2 px-4 py-3 border-b border-ink-200 bg-surface-raised/30">
  {/* Search */}
  <div className="relative flex-1 max-w-xs">
    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300" />
    <input
      className="w-full h-9 pl-9 pr-3 rounded-lg border border-ink-200 text-sm bg-white
                 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
      placeholder="Search policies..."
    />
  </div>

  {/* Filters */}
  <FilterDropdown label="Status" options={statusOptions} />
  <FilterDropdown label="Product" options={productOptions} />
  <DateRangePicker label="Last 30 days" />

  <div className="ml-auto flex items-center gap-2">
    {/* Bulk action — appears when rows selected */}
    {selectedRows.length > 0 && (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 border border-brand-200">
        <span className="text-xs font-medium text-brand-700">{selectedRows.length} selected</span>
        <button className="text-xs text-red-600 font-medium hover:text-red-800">Delete</button>
        <button className="text-xs text-ink-600 font-medium hover:text-ink-900">Export</button>
      </div>
    )}
    <Link href="/policy/create">
      <button className="h-9 px-4 bg-ink-900 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-ink-700 transition-colors">
        <PlusIcon className="w-4 h-4" />
        New Policy
      </button>
    </Link>
  </div>
</div>

// Table
<table className="w-full">
  <thead>
    <tr className="border-b border-ink-200">
      <th className="px-4 py-3 w-10">
        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
      </th>
      {/* Sortable column headers */}
      <SortableHeader col="name" label="Policy Name / ID" />
      <SortableHeader col="product" label="Product" />
      <SortableHeader col="lastModified" label="Last Modified" />
      <SortableHeader col="version" label="Version" />
      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">Status</th>
      <th className="px-4 py-3 w-24" />
    </tr>
  </thead>
  <tbody>
    {isLoading
      ? Array.from({ length: 6 }).map((_, i) => <PolicyRowSkeleton key={i} />)
      : policies.length === 0
        ? <EmptyTableState />
        : policies.map(p => <PolicyRow key={p.id} policy={p} />)
    }
  </tbody>
</table>

// Policy row
<tr className="hover:bg-surface-raised/50 transition-colors group border-b border-ink-200 last:border-0">
  <td className="px-4 py-3.5"><Checkbox checked={selected} onCheckedChange={toggle} /></td>
  <td className="px-4 py-3.5">
    <div>
      <p className="text-sm font-semibold text-ink-900 group-hover:text-brand-600 transition-colors">
        {policy.name}
      </p>
      <p className="text-xs text-ink-300 font-mono mt-0.5">{policy.id}</p>
    </div>
  </td>
  <td className="px-4 py-3.5">
    <span className="text-sm text-ink-500">{policy.product}</span>
  </td>
  <td className="px-4 py-3.5">
    <div>
      <p className="text-sm text-ink-700">{formatDate(policy.lastModified)}</p>
      <p className="text-xs text-ink-300">{formatRelative(policy.lastModified)}</p>
    </div>
  </td>
  <td className="px-4 py-3.5">
    <span className="text-sm font-mono text-ink-500">{policy.version}</span>
  </td>
  <td className="px-4 py-3.5"><StatusBadge status={policy.status} /></td>
  <td className="px-4 py-3.5">
    {/* Actions — always visible on hover */}
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <IconButton icon={<EyeIcon />} tooltip="View" href={`/policy/${policy.id}`} />
      <IconButton icon={<EditIcon />} tooltip="Edit" href={`/policy/${policy.id}/edit`} />
      <DropdownMenu trigger={<IconButton icon={<MoreHorizontalIcon />} />}>
        <DropdownItem icon={<CopyIcon />} label="Duplicate" />
        <DropdownItem icon={<DownloadIcon />} label="Export" />
        <DropdownSeparator />
        <DropdownItem icon={<TrashIcon />} label="Delete" destructive />
      </DropdownMenu>
    </div>
  </td>
</tr>
```

### 3.5 AuditLogEntry

**Inspired by Vercel's deployment activity + GitHub commit timeline**

```tsx
// Timeline container
<div className="relative">
  {/* Vertical line */}
  <div className="absolute left-[19px] top-0 bottom-0 w-px bg-ink-200" />

  {entries.map((entry, i) => (
    <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
      {/* Event dot */}
      <div className={cn(
        "relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm",
        eventConfig[entry.action].dotBg
      )}>
        <span className="w-4 h-4 text-white">{eventConfig[entry.action].icon}</span>
      </div>

      {/* Content card */}
      <div className="flex-1 bg-white rounded-xl border border-ink-200 p-4 shadow-xs hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
              eventConfig[entry.action].badge
            )}>
              {entry.action}
            </span>
            <span className="text-xs text-ink-500">
              by <span className="font-medium text-ink-700">{entry.user}</span>
            </span>
          </div>
          <time className="text-xs text-ink-300 flex-shrink-0">{formatDate(entry.timestamp)}</time>
        </div>
        <p className="text-sm text-ink-700 mt-2 leading-relaxed">{entry.description}</p>
        {entry.diff && (
          <div className="mt-3 p-3 bg-surface-raised rounded-lg font-mono text-xs">
            <span className="text-red-600">- {entry.diff.old}</span>
            <br />
            <span className="text-green-600">+ {entry.diff.new}</span>
          </div>
        )}
      </div>
    </div>
  ))}
</div>

// Event config
const eventConfig = {
  SUBMITTED: { dotBg: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700',   icon: <SendIcon /> },
  UPDATED:   { dotBg: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700',icon: <EditIcon /> },
  APPROVED:  { dotBg: 'bg-green-500',  badge: 'bg-green-50 text-green-700',  icon: <CheckIcon /> },
  REJECTED:  { dotBg: 'bg-red-500',    badge: 'bg-red-50 text-red-700',      icon: <XIcon /> },
  CREATED:   { dotBg: 'bg-teal-500',   badge: 'bg-teal-50 text-teal-700',    icon: <PlusIcon /> },
  PUBLISHED: { dotBg: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700',icon: <GlobeIcon /> },
  REVERTED:  { dotBg: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700',  icon: <RotateCcwIcon /> },
}
```

### 3.6 Policy Simulation Panel

**Inspired by Stripe Radar + Retool — split panel with live result feedback**

```tsx
// Split layout: 38% left | 62% right
<div className="flex gap-5 h-full">

  {/* LEFT — Policy selector */}
  <div className="w-[380px] flex-shrink-0 bg-white rounded-xl border border-ink-200 flex flex-col overflow-hidden">
    <div className="p-4 border-b border-ink-200">
      <h2 className="text-base font-semibold text-ink-900">Select Policy</h2>
      <div className="relative mt-3">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300" />
        <input className="w-full h-9 pl-9 pr-3 rounded-lg border border-ink-200 text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" placeholder="Search policies..." />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto divide-y divide-ink-200">
      {policies.map(p => (
        <button
          key={p.id}
          onClick={() => setSelected(p)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors",
            selected?.id === p.id
              ? "bg-ink-900 text-white"
              : "hover:bg-surface-raised text-ink-700"
          )}
        >
          <div>
            <p className="text-sm font-semibold">{p.name}</p>
            <p className={cn("text-xs mt-0.5", selected?.id === p.id ? "text-ink-300" : "text-ink-300")}>
              {p.version} · {p.ruleCount} rules
            </p>
          </div>
          <ChevronRightIcon className="w-4 h-4 opacity-50" />
        </button>
      ))}
    </div>
  </div>

  {/* RIGHT — Test form */}
  <div className="flex-1 bg-white rounded-xl border border-ink-200 flex flex-col overflow-hidden">
    {selected ? (
      <>
        <div className="p-6 border-b border-ink-200">
          <h2 className="text-lg font-bold text-ink-900">{selected.name}</h2>
          <p className="text-sm text-ink-500 mt-0.5">Enter test data to evaluate against {selected.ruleCount} BRE rules</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {fields.map(field => (
            <SimulationField key={field.id} field={field} />
          ))}
        </div>

        {/* Result banner — appears after run */}
        {result && (
          <div className={cn(
            "mx-6 mb-4 p-4 rounded-xl border flex items-center gap-3",
            result.eligible
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          )}>
            {result.eligible
              ? <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
              : <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
            }
            <div>
              <p className={cn("font-bold text-base", result.eligible ? "text-green-800" : "text-red-800")}>
                {result.eligible ? "✅ Eligible" : "❌ Not Eligible"}
              </p>
              <p className="text-xs text-ink-500 mt-0.5">
                {result.passed}/{result.total} rules passed
                {result.hardFailures > 0 && ` · ${result.hardFailures} hard failures`}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-ink-200">
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="w-full h-11 bg-ink-900 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-ink-700 disabled:opacity-50 transition-colors"
          >
            {isRunning
              ? <><Loader2Icon className="w-4 h-4 animate-spin" />Running...</>
              : <><PlayIcon className="w-4 h-4" />Run Simulation</>
            }
          </button>
        </div>
      </>
    ) : (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState icon={<FlaskConicalIcon />} title="Select a policy" description="Choose a policy from the left to start simulation" />
      </div>
    )}
  </div>
</div>

// SimulationField component
function SimulationField({ field }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-ink-900">{field.label}</label>
        {field.constraint && (
          <span className="text-xs text-ink-300 font-mono bg-surface-raised px-1.5 py-0.5 rounded">
            {field.constraint}
          </span>
        )}
        {field.required && <span className="text-xs text-red-500">*</span>}
      </div>
      <input
        type={field.inputType}
        placeholder={`Enter ${field.label.toLowerCase()}`}
        className={cn(
          "w-full h-10 px-3 rounded-lg border text-sm transition-colors",
          "placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
          error ? "border-red-400 bg-red-50" : "border-ink-200 bg-white hover:border-ink-300"
        )}
      />
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3" />{error}</p>}
      {valid && <p className="text-xs text-green-600 flex items-center gap-1"><CheckIcon className="w-3 h-3" />Within range</p>}
    </div>
  )
}
```

### 3.7 Template Card (Create Policy)

**Inspired by Vercel template gallery — hover reveal, category labels, stats row**

```tsx
// Blank policy card
<button
  onClick={() => onSelect('blank')}
  className={cn(
    "relative w-full text-left rounded-xl p-6 border-2 transition-all duration-150",
    selected === 'blank'
      ? "border-brand-500 bg-brand-25 shadow-md"
      : "border-dashed border-ink-200 hover:border-ink-300 hover:bg-surface-raised"
  )}
>
  {selected === 'blank' && (
    <span className="absolute top-3 right-3 flex items-center gap-1 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
      <CheckIcon className="w-3 h-3" /> Selected
    </span>
  )}
  <div className="w-12 h-12 rounded-xl border-2 border-dashed border-ink-200 flex items-center justify-center mb-4 bg-white">
    <FilePlusIcon className="w-6 h-6 text-ink-300" />
  </div>
  <h3 className="text-base font-bold text-ink-900">Blank Policy</h3>
  <p className="text-sm text-ink-500 mt-1.5 leading-relaxed">
    Start with an empty draft and build the full structure manually or with AI assistance.
  </p>
  <div className="flex gap-2 mt-4">
    {['Empty Draft', 'Manual Build'].map(tag => (
      <span key={tag} className="px-2.5 py-0.5 bg-ink-100 text-ink-500 text-xs rounded-full font-medium">{tag}</span>
    ))}
  </div>
</button>

// Predefined template card
<div className="group relative bg-white rounded-xl border border-ink-200 p-6 hover:border-ink-300 hover:shadow-md transition-all duration-150 cursor-pointer">
  {/* Category */}
  <p className="text-[10px] font-bold uppercase tracking-widest text-ink-300 mb-3">{template.category}</p>

  {/* Icon */}
  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
       style={{ backgroundColor: `${template.accentColor}18` }}>
    <template.Icon className="w-6 h-6" style={{ color: template.accentColor }} />
  </div>

  <h3 className="text-base font-bold text-ink-900">{template.name}</h3>
  <p className="text-sm text-ink-500 mt-1.5 leading-relaxed text-[13px]">{template.description}</p>

  {/* Stats */}
  <div className="flex gap-5 mt-4 pt-4 border-t border-ink-200">
    {[
      { label: 'Tabs', value: template.tabs },
      { label: 'Groups', value: template.groups },
      { label: 'Fields', value: template.fields },
    ].map(stat => (
      <div key={stat.label}>
        <p className="text-base font-bold text-ink-900 tabular-nums">{stat.value}</p>
        <p className="text-xs text-ink-400">{stat.label}</p>
      </div>
    ))}
  </div>

  {/* Tags */}
  <div className="flex flex-wrap gap-1.5 mt-3">
    {template.tags.map(tag => (
      <span key={tag} className="px-2 py-0.5 bg-surface-raised text-ink-500 text-[11px] rounded-full font-medium">{tag}</span>
    ))}
  </div>

  {/* Hover actions — slide up */}
  <div className="absolute inset-x-0 bottom-0 p-3 flex gap-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 bg-gradient-to-t from-white via-white/95 to-transparent rounded-b-xl">
    <button
      onClick={() => onSelectTemplate(template)}
      className="flex-1 h-9 bg-ink-900 text-white rounded-lg text-sm font-semibold hover:bg-ink-700 transition-colors"
    >
      Use Template
    </button>
    <button
      onClick={() => onPreview(template)}
      className="h-9 px-3 border border-ink-200 rounded-lg text-sm text-ink-600 hover:bg-surface-raised transition-colors flex items-center gap-1.5"
    >
      <EyeIcon className="w-3.5 h-3.5" /> Preview
    </button>
  </div>
</div>
```

### 3.8 Buttons

```tsx
// Primary — black (used for main CTAs like "New Policy", "Run Simulation")
className="h-10 px-4 bg-ink-900 text-white text-sm font-semibold rounded-lg
           hover:bg-ink-700 active:bg-ink-950 disabled:opacity-40 disabled:cursor-not-allowed
           flex items-center gap-2 transition-colors"

// Brand — indigo (used for "Submit for Review", links)
className="h-10 px-4 bg-brand-600 text-white text-sm font-semibold rounded-lg
           hover:bg-brand-700 active:bg-brand-800 disabled:opacity-40
           flex items-center gap-2 transition-colors"

// Secondary — outline (used for secondary actions)
className="h-10 px-4 border border-ink-200 text-ink-700 text-sm font-semibold rounded-lg
           hover:bg-surface-raised hover:border-ink-300 active:bg-surface-raised
           flex items-center gap-2 transition-colors"

// Ghost — no border (used for tertiary actions, cancel)
className="h-10 px-4 text-ink-500 text-sm font-semibold rounded-lg
           hover:bg-surface-raised hover:text-ink-900 transition-colors"

// Danger — red (destructive actions)
className="h-10 px-4 bg-red-600 text-white text-sm font-semibold rounded-lg
           hover:bg-red-700 active:bg-red-800 disabled:opacity-40 transition-colors"

// Icon button — square ghost
className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-400
           hover:bg-surface-raised hover:text-ink-900 transition-colors"

// Size variants: add 'sm' (h-8 px-3 text-xs) or 'lg' (h-11 px-5) class modifiers
```

### 3.9 Form Inputs

```tsx
// Text input — standard
<div className="space-y-1.5">
  <label className="text-sm font-medium text-ink-700" htmlFor={id}>{label}</label>
  <input
    id={id}
    className="w-full h-10 px-3 rounded-lg border border-ink-200 text-sm text-ink-900 bg-white
               placeholder:text-ink-300
               hover:border-ink-300
               focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
               disabled:bg-surface-raised disabled:text-ink-300 disabled:cursor-not-allowed
               aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-100 aria-[invalid=true]:bg-red-50
               transition-colors"
  />
  {error && (
    <p className="text-xs text-red-600 flex items-center gap-1">
      <AlertCircleIcon className="w-3 h-3 flex-shrink-0" />{error}
    </p>
  )}
  {hint && <p className="text-xs text-ink-400">{hint}</p>}
</div>

// Select dropdown
className="w-full h-10 px-3 pr-9 rounded-lg border border-ink-200 text-sm text-ink-900 bg-white
           appearance-none cursor-pointer
           focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
           hover:border-ink-300 transition-colors"

// Textarea
className="w-full px-3 py-2.5 rounded-lg border border-ink-200 text-sm text-ink-900 bg-white
           placeholder:text-ink-300 resize-none
           focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
           hover:border-ink-300 transition-colors"
```

### 3.10 Skeleton Loaders

**Every component that loads async data MUST have a skeleton. Use the shimmer animation.**

```tsx
// Stat card skeleton
function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-ink-200 p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-28 animate-shimmer rounded-lg" />
        <div className="h-8 w-8 animate-shimmer rounded-lg" />
      </div>
      <div className="h-9 w-16 animate-shimmer rounded-lg mb-2" />
      <div className="h-3 w-24 animate-shimmer rounded" />
    </div>
  )
}

// Table row skeleton (render 6 of these while loading)
function TableRowSkeleton() {
  return (
    <tr className="border-b border-ink-200">
      <td className="px-4 py-4"><div className="h-4 w-4 animate-shimmer rounded" /></td>
      <td className="px-4 py-4">
        <div className="h-4 w-44 animate-shimmer rounded mb-1.5" />
        <div className="h-3 w-28 animate-shimmer rounded" />
      </td>
      <td className="px-4 py-4"><div className="h-4 w-20 animate-shimmer rounded" /></td>
      <td className="px-4 py-4"><div className="h-4 w-28 animate-shimmer rounded" /></td>
      <td className="px-4 py-4"><div className="h-4 w-10 animate-shimmer rounded" /></td>
      <td className="px-4 py-4"><div className="h-5 w-24 animate-shimmer rounded-full" /></td>
      <td className="px-4 py-4"><div className="h-4 w-16 animate-shimmer rounded" /></td>
    </tr>
  )
}

// Audit entry skeleton
function AuditEntrySkeleton() {
  return (
    <div className="flex gap-4 pb-6">
      <div className="w-10 h-10 rounded-full animate-shimmer flex-shrink-0" />
      <div className="flex-1 bg-white rounded-xl border border-ink-200 p-4">
        <div className="flex justify-between">
          <div className="h-5 w-32 animate-shimmer rounded-full" />
          <div className="h-4 w-24 animate-shimmer rounded" />
        </div>
        <div className="h-4 w-3/4 animate-shimmer rounded mt-3" />
      </div>
    </div>
  )
}
```

### 3.11 Empty States

```tsx
interface EmptyStateProps {
  icon:        React.ReactNode
  title:       string
  description: string
  action?:     { label: string; onClick: () => void; href?: string }
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-raised flex items-center justify-center mb-5">
        <span className="w-8 h-8 text-ink-300">{icon}</span>
      </div>
      <h3 className="text-base font-semibold text-ink-900 mb-2">{title}</h3>
      <p className="text-sm text-ink-500 max-w-sm leading-relaxed mb-6">{description}</p>
      {action && (
        action.href
          ? <Link href={action.href}><PrimaryButton>{action.label}</PrimaryButton></Link>
          : <PrimaryButton onClick={action.onClick}>{action.label}</PrimaryButton>
      )}
    </div>
  )
}

// Usage examples
<EmptyState
  icon={<FolderOpenIcon />}
  title="No policies found"
  description="Try adjusting your search or filters, or create a new policy to get started."
  action={{ label: '+ Create Policy', href: '/policy/create' }}
/>

<EmptyState
  icon={<FlaskConicalIcon />}
  title="Select a policy to simulate"
  description="Choose any policy from the list on the left to run a BRE simulation."
/>
```

### 3.12 Modal / Drawer

```tsx
// Confirmation modal
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />

  {/* Modal */}
  <div className="relative bg-white rounded-2xl shadow-modal p-6 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
        <AlertTriangleIcon className="w-5 h-5 text-red-600" />
      </div>
      <div className="flex-1">
        <h2 className="text-base font-bold text-ink-900">{title}</h2>
        <p className="text-sm text-ink-500 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
    <div className="flex justify-end gap-3 mt-6">
      <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
      <DangerButton onClick={onConfirm}>Delete</DangerButton>
    </div>
  </div>
</div>

// Side drawer (Approval panel, Policy detail)
<div className={cn(
  "fixed inset-y-0 right-0 z-40 flex flex-col bg-white shadow-xl border-l border-ink-200",
  "w-[600px] transition-transform duration-300",
  open ? "translate-x-0" : "translate-x-full"
)}>
  <div className="flex items-center justify-between px-6 py-4 border-b border-ink-200">
    <h2 className="text-base font-semibold text-ink-900">{title}</h2>
    <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-surface-raised flex items-center justify-center">
      <XIcon className="w-4 h-4 text-ink-500" />
    </button>
  </div>
  <div className="flex-1 overflow-y-auto p-6">{children}</div>
  {footer && <div className="p-4 border-t border-ink-200 flex gap-3">{footer}</div>}
</div>
```

### 3.13 Toast Notifications

```tsx
// Use sonner — install: pnpm add sonner
// In layout.tsx: <Toaster position="bottom-right" richColors />

// Usage throughout the app:
toast.success('Policy submitted for review', { description: 'The checker has been notified.' })
toast.error('Failed to save', { description: error.message })
toast.loading('Extracting policy document...')
toast.promise(savePolicy(), {
  loading: 'Saving draft...',
  success: 'Draft saved',
  error:   'Failed to save draft',
})
```

### 3.14 BRE Simulation Result Table

**Shown after "Run Simulation" — inspired by Retool's query result + Camunda's rule evaluation**

```tsx
<div className="rounded-xl border border-ink-200 overflow-hidden mt-4">
  <div className="flex items-center justify-between px-4 py-3 bg-surface-raised border-b border-ink-200">
    <h3 className="text-sm font-semibold text-ink-900">Rule Evaluation Results</h3>
    <div className="flex gap-3 text-xs text-ink-500">
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />{result.passed} passed</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{result.failed} failed</span>
      {result.warnings > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />{result.warnings} warnings</span>}
    </div>
  </div>
  <table className="w-full text-sm">
    <thead className="bg-surface-raised/50">
      <tr>
        <th className="px-4 py-2 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider w-8"></th>
        <th className="px-4 py-2 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">Rule</th>
        <th className="px-4 py-2 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">Threshold</th>
        <th className="px-4 py-2 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">Your Value</th>
        <th className="px-4 py-2 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">Result</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-ink-200">
      {result.details.map(r => (
        <tr key={r.rule_id} className={cn(
          "transition-colors",
          r.result === 'FAIL' ? "bg-red-50/40" : r.result === 'WARN' ? "bg-amber-50/30" : ""
        )}>
          <td className="px-4 py-3">
            {r.result === 'PASS' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
            {r.result === 'FAIL' && <XCircleIcon className="w-4 h-4 text-red-500" />}
            {r.result === 'WARN' && <AlertCircleIcon className="w-4 h-4 text-amber-500" />}
          </td>
          <td className="px-4 py-3 font-medium text-ink-900">{r.attribute}</td>
          <td className="px-4 py-3 font-mono text-ink-500">{r.threshold}</td>
          <td className="px-4 py-3 font-mono text-ink-700">{r.actual}</td>
          <td className="px-4 py-3">
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
              r.result === 'PASS' ? "bg-green-100 text-green-700" :
              r.result === 'FAIL' ? "bg-red-100 text-red-700" :
              "bg-amber-100 text-amber-700"
            )}>
              {r.result}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 3.15 Upload Zone (Policy Extraction)

**On Create Policy screen when "Upload Existing" is chosen**

```tsx
<div className={cn(
  "border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer",
  isDragging
    ? "border-brand-500 bg-brand-50"
    : "border-ink-200 hover:border-ink-300 hover:bg-surface-raised"
)}>
  <div className="w-14 h-14 rounded-2xl bg-surface-raised flex items-center justify-center mx-auto mb-4">
    <UploadCloudIcon className="w-7 h-7 text-ink-300" />
  </div>
  <p className="text-sm font-semibold text-ink-900 mb-1">
    {isDragging ? "Drop your file here" : "Drag & drop your policy file"}
  </p>
  <p className="text-xs text-ink-400 mb-4">DOCX or PDF · Max 25MB</p>
  <button className="h-9 px-4 border border-ink-200 rounded-lg text-sm font-medium text-ink-700 hover:bg-surface-raised transition-colors">
    Browse files
  </button>

  {/* Upload progress */}
  {uploading && (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-ink-500">{filename}</span>
        <span className="text-xs text-ink-500">{progress}%</span>
      </div>
      <div className="h-1.5 bg-ink-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )}
</div>
```

---

## 4. SCREEN SPECIFICATIONS

### 4.1 Overview — Policy Management

```
Route:    /policy
API:      GET /api/policy/list  |  GET /api/policy/stats

TOP:
  Title:    "Policy Management"
  Subtitle: "Overview of active and draft lending criteria rules for automated decisioning."
  Action:   [+ New Policy] button — top right

STAT CARDS (4 in a row, gap-4):
  1. Active Policies   — value: count, delta: "+2.5% this month", variant: success, icon: ShieldCheckIcon
  2. Pending Approval  — value: count, delta: "+4 new", variant: warning, icon: ClipboardIcon, onClick → /policy/queue
  3. Total Drafts      — value: count, variant: neutral, icon: FileEditIcon
  4. Published         — value: count, variant: info, icon: GlobeIcon

POLICY TABLE (mt-8):
  Filter bar + sortable columns + StatusBadge + row actions
  Default sort: lastModified DESC
  Pagination: 20 per page
```

### 4.2 Audit Log

```
Route:    /policy/audit
API:      GET /api/audit/logs?page=1&limit=20

TOP:
  Title:    "Audit Log"
  Subtitle: "Track all policy changes and modifications"
  Action:   [↓ Export Audit Log] button

CONTENT:
  Search bar: full width, "Search by policy name..."
  Timeline grouped by policy (policy name as collapsible group header)
  Each group shows: policy name, version, entry count, collapse toggle
  Entries inside: vertical timeline with dots + event cards
  Newest entries first within each group
```

### 4.3 Policy Simulation

```
Route:    /policy/simulation
API:      GET /api/policy/list  |  POST /api/policy/{id}/simulate

Split panel layout — 38/62 split
Left:  Policy selector list with search
Right: Dynamic form based on selected policy's BRE rules
       → Run Simulation → Result banner + detailed rule table
```

### 4.4 Create New Policy

```
Route:    /policy/create
API:      POST /api/policy/create  |  POST /api/extraction/upload-policy

TOP:
  Title:    "Create New Policy"
  Subtitle: "Start from a blank draft, upload an existing policy, or pick a predefined template."
  Badge:    "✦ 6 predefined templates available"

SECTION — "Choose a Starting Point" (with sparkle icon):
  3-column grid on desktop (gap-4):
    Blank Policy card (dashed, selected by default)
    Template cards...

SECTION — "Getting Started" (appears after selection):
  If Blank selected:    Show name input + optional AI prompt textarea
  If Upload selected:   Show upload drop zone (DOCX/PDF)
  If Template selected: Show template preview + name input

STICKY BOTTOM BAR:
  [← Back]  [Continue →] — only enabled when name is filled
```

### 4.5 Policy Editor

```
Route:    /policy/{id}/edit
API:      GET /api/policy/{id}  |  PUT /api/policy/{id}  |  POST /api/policy/{id}/submit

LAYOUT:
  Breadcrumb: Overview > {policyName} > Edit
  Page header: {policyName} + StatusBadge + [Save Draft] [Submit for Review →]
  
  Two-column below header:
    LEFT 220px — Vertical tab list (sticky):
      Each tab: icon + name + field count badge
      Active: left border brand-600, bg brand-50, text brand-600
      Inactive: text ink-500, hover bg surface-raised

    RIGHT flex-1 — Content area:
      SubTab pills bar (horizontal scroll):
        Pill style: rounded-full, active bg ink-900 text white, inactive bg surface-raised
      
      Fields section:
        table mode:  Grid of editable rule cards
        document mode: Rich text block with inline edit
      
      [+ Add Field] button at bottom of section
      [+ Add SubTab] button in pills bar

  BOTTOM BAR (sticky, border-t):
    Left: "Auto-saved 2 min ago" with subtle dot
    Right: [Discard] [Save Draft] [Submit for Review →]
```

### 4.6 Approval Queue

```
Route:    /policy/queue
Visible:  CHECKER, APPROVER, ADMIN only

LAYOUT:
  Title: "Approval Queue"
  Filter tabs: [All] [Pending Review N] [Under Review N]
  
  Card list (not table — more info needed per item):
    Each card: policy name + version + submitter + date + status + [Review] button
  
  On [Review] click:
    Side drawer opens (600px):
      Top: Policy name + status + submitted by
      Middle: Tab-by-tab diff (what changed vs previous version)
      Bottom: Comment textarea + [Approve] [Request Changes] [Reject] buttons
```

### 4.7 My Policies

```
Route:    /policy/mine
Filter:   Automatically filtered to current user's policies

Same layout as Overview table but:
  No "Pending Approval" stat card
  Shows user's own policies only
  Quick action: [Continue Editing] for drafts
```

### 4.8 Version History

```
Route:    /policy/versions  or  /policy/{id}/versions
API:      GET /api/policy/{id}/versions

LAYOUT:
  Left panel: Version list (v1.0, v1.5, v2.0...) with dates + status
  Right panel: Version detail — tabs/fields snapshot
  Diff button: Compare any two versions side by side
```

---

## 5. INTERACTIONS & MICRO-INTERACTIONS

**Source: Linear's feel — fast, purposeful, never flashy**

```
Hover:        150ms ease-out transition on bg, border, text color
Focus:        2px ring brand-500/25 + border brand-500 — always visible
Active press: scale-[0.98] on buttons (subtle click feel)
Modal open:   fade-in + zoom-in-95, 200ms
Drawer open:  slide from right, 300ms ease-out
Toast:        slide up from bottom-right, 300ms
Skeleton:     shimmer animation, 1.5s infinite
Row hover:    bg change only, 100ms — never move/shift elements
Tab switch:   instant — no animation (Linear pattern)
Collapse:     200ms height transition for sidebar, accordion
```

---

## 6. DATA FETCHING

```tsx
// ALWAYS TanStack Query — never bare useEffect

// List with filters
const { data, isLoading } = useQuery({
  queryKey: ['policies', filters],
  queryFn: () => api.policies.list(filters),
  staleTime: 30_000,
  placeholderData: keepPreviousData,   // prevent flicker on filter change
})

// Single item
const { data: policy } = useQuery({
  queryKey: ['policy', id],
  queryFn: () => api.policies.get(id),
  enabled: !!id,
})

// Mutation with optimistic update
const saveMutation = useMutation({
  mutationFn: api.policies.save,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['policy', id] })
    const previous = queryClient.getQueryData(['policy', id])
    queryClient.setQueryData(['policy', id], newData)   // optimistic
    return { previous }
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(['policy', id], context?.previous)
    toast.error('Failed to save')
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['policies'] })
    toast.success('Draft saved')
  },
})

// Polling for async job (extraction pipeline)
const { data: job } = useQuery({
  queryKey: ['job', jobId],
  queryFn: () => api.extraction.getJob(jobId),
  refetchInterval: (data) => {
    if (data?.status === 'completed' || data?.status === 'failed') return false
    return 2000   // poll every 2s while running
  },
  enabled: !!jobId,
})
```

---

## 7. STATE MANAGEMENT (Zustand)

```ts
// Rule: Zustand is ONLY for UI state. Server data lives in TanStack Query.

// Auth store
interface AuthStore {
  user: { id: string; name: string; role: 'MAKER'|'CHECKER'|'APPROVER'|'ADMIN' } | null
  setUser: (u: AuthStore['user']) => void
  logout: () => void
}

// Editor store (policy editor UI state only)
interface EditorStore {
  activeTabIndex:     number
  activeSubTabIndex:  number
  isDirty:            boolean    // unsaved changes
  lastSavedAt:        Date | null
  setActiveTab:       (i: number) => void
  setActiveSubTab:    (i: number) => void
  markDirty:          () => void
  markClean:          (at: Date) => void
}

// Simulation store
interface SimulationStore {
  selectedPolicyId: string | null
  formValues:       Record<string, string | number>
  result:           BREResult | null
  setPolicy:        (id: string) => void
  setField:         (key: string, value: string | number) => void
  setResult:        (r: BREResult) => void
  clearResult:      () => void
}
```

---

## 8. ROLE-BASED UI

```ts
// Use this hook everywhere — never inline role checks
function usePermissions() {
  const { user } = useAuthStore()
  const role = user?.role
  return {
    canCreatePolicy:   ['MAKER', 'ADMIN'].includes(role),
    canEditPolicy:     ['MAKER', 'ADMIN'].includes(role),
    canSubmitForReview:['MAKER', 'ADMIN'].includes(role),
    canReviewPolicy:   ['CHECKER', 'APPROVER', 'ADMIN'].includes(role),
    canApprovePolicy:  ['APPROVER', 'ADMIN'].includes(role),
    canPublishPolicy:  ['APPROVER', 'ADMIN'].includes(role),
    canViewAuditLog:   ['MAKER', 'CHECKER', 'APPROVER', 'ADMIN'].includes(role),
    canExportAudit:    ['ADMIN', 'APPROVER'].includes(role),
    canRunSimulation:  true,
    isAdmin:           role === 'ADMIN',
  }
}

// Sidebar nav visibility
const navByRole = {
  MAKER:    ['Overview', 'Versions', 'Audit Log', 'Simulation', 'My Policies', 'Create Policy'],
  CHECKER:  ['Overview', 'Audit Log', 'Simulation', 'Approval Queue'],
  APPROVER: ['Overview', 'Audit Log', 'Simulation', 'Approval Queue'],
  ADMIN:    ['Overview', 'Versions', 'Audit Log', 'Simulation', 'My Policies', 'Create Policy', 'Approval Queue'],
}
```

---

## 9. ACCESSIBILITY

```
- All icon-only buttons: aria-label="..."
- All form inputs: id + htmlFor pairing
- Focus visible: always 2px ring — never outline: none without replacement
- Color contrast: all text meets WCAG AA (4.5:1 for body, 3:1 for large)
- Modals: focus trap + Escape to close + aria-modal
- Tables: proper thead/th scope="col" + caption
- Status badges: don't rely on color alone — always include text
- Loading states: aria-busy="true" on loading containers
- Error messages: role="alert" for dynamic errors
```

---

## 10. CODING RULES

1. **Tailwind only** — never inline styles, never CSS modules, never styled-components
2. **TanStack Query** for all server data — never `useEffect + fetch`
3. **Zustand** for UI state only — never Context API for app-wide state
4. **react-hook-form + zod** for all forms — never uncontrolled inputs
5. **sonner** for all toasts — never `alert()` or custom toast state
6. **lucide-react** for all icons — never mix icon libraries
7. **Skeleton loaders** are mandatory for every async component
8. **Empty states** are mandatory for every list/table
9. **TypeScript strict** — no `any`, proper return types, interface before type for objects
10. **Color tokens only** — use `text-ink-900` not `text-gray-900`, `bg-surface-raised` not `bg-gray-100`
11. **cn() utility** — always use `cn()` (clsx + tailwind-merge) for conditional classes
12. **No magic numbers** — use spacing tokens from the design system
13. **Transitions** — `transition-colors duration-150` for color changes, `transition-all duration-200` for size/position
14. **Responsive** — desktop-first, add `lg:` and `md:` breakpoints for layout grids
15. **Auto-save** — policy editor must auto-save draft every 30 seconds when isDirty
16. **Debounce** — all search inputs must debounce 300ms before querying
17. **Error boundaries** — wrap each major section in an ErrorBoundary component

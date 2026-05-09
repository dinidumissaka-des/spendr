# Spendr Design System

Loaded when working on UI, styling, or component tasks.

## Color tokens (Tailwind)
| Use | Class |
|-----|-------|
| Card background | `bg-white/[0.07]` |
| Elevated surface | `bg-white/10` |
| Subtle border | `border-white/[0.1]` |
| Active border | `border-white/[0.15]` or `border-white/25` |
| Body text | `text-white` |
| Muted text | `text-muted` (= white/42%) |
| Accent green | `text-accent` / `bg-accent` (#9FE870) |
| Text on accent | `text-[#163300]` |
| Danger red | `text-danger` / `border-danger/40` |

**Never use**: `bg-surface`, `border-border`, `bg-surface2` — they render as white.

## Component patterns

### Glass card
```tsx
<GlassSurface borderRadius={28} backgroundOpacity={0.07}>
  <div className="px-5 py-4 w-full">...</div>
</GlassSurface>
```

### Pill toggle (active/inactive)
```tsx
className={`flex-1 py-2 text-sm font-mono rounded-full transition-colors ${
  active ? "bg-white/10 backdrop-blur-md text-white font-semibold border border-white/15"
         : "text-muted hover:text-white"
}`}
```

### Glass button (header pills)
```tsx
className="h-8 px-3 rounded-full border border-white/[0.1] bg-white/[0.07] backdrop-blur-md text-white/40 hover:text-white/90 hover:border-white/[0.3] transition-colors text-xs font-mono"
```

### Input (dark glass)
```tsx
className="bg-white/[0.07] border border-white/[0.1] rounded-lg px-3 h-10 text-base text-white placeholder:text-muted outline-none focus:border-white/30"
```
For number inputs, also add: `[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`

### Hover-reveal action buttons
```tsx
<div className="group flex items-center ...">
  {/* content */}
  <div className="hidden sm:flex gap-1 overflow-hidden w-0 group-hover:w-[60px] transition-all duration-200 flex-shrink-0">
    <button ...><Pencil size={13} /></button>
    <button ...><Trash2 size={13} /></button>
  </div>
</div>
```

### Category tag
```tsx
<span className="text-xs font-mono px-1.5 py-0.5 rounded-full bg-white/[0.07] text-white/40">
  {category}
</span>
```

## Typography
- All text uses Manrope (font-sans, font-mono, font-serif all map to Manrope)
- Hero numbers: `font-mono text-3xl font-bold text-white`
- Section labels: `font-sans text-xs text-muted uppercase tracking-wider font-semibold`
- Body: `text-sm text-white font-sans`

## Spacing & radius
- GlassSurface cards: `borderRadius={28}` always
- Pill buttons: `rounded-full`
- Inputs: `rounded-lg`
- Gap between cards: `gap-2` in the main flex column
- Inner card padding: `px-5 py-4` (summary rows), `px-4 py-3.5` (list rows)

## Hero stat card (StatsBar)
The "This Month" stat is always full-width with green glow border:
```tsx
style={{ boxShadow: "0 0 12px rgba(159,232,112,0.07)", borderColor: "rgba(159,232,112,0.3)" }}
```

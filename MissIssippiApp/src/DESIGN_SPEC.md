# Miss Issippi — UI Design Specification
**Version 1.0**
**Sources: Third Wave Media Portal theme (all pages) + Upload Inventory screenshot**
**Canonical reference page: Upload Inventory**

---

## HOW TO USE THIS DOCUMENT

Paste this entire file at the start of every new Claude conversation, along with `theme.css`, then say:

> "You are a senior UI designer continuing work on my app. Read this design spec completely before producing anything. The Upload Inventory page is the canonical visual reference. Every page must look like it was built by the same designer on the same day."

---

## 1. DESIGN PHILOSOPHY

### The one rule
Every page must look like it came from the same designer on the same day. If something could have come from a different project, it is wrong.

### Visual language
- **Base:** Third Wave Media Portal Bootstrap 5 admin theme
- **Feel:** Clean, flat, professional, minimal. Content does the work — decoration does nothing.
- **Depth model:** Surface hierarchy is created exclusively through background colour and `1px` borders. Never through shadows, gradients, or elevation.
- **Restraint:** When in doubt, do less. Quiet pages feel more professional than busy ones.

### Hard rules — never break these
1. No drop shadows anywhere. `box-shadow: none !important` is enforced globally.
2. No gradients anywhere.
3. No decorative flourishes, divider icons, or ornamental elements.
4. No inline `style=""` attributes in production code. Every style goes through a CSS class.
5. No toggle switches for mode/view selection. Use segmented button groups.
6. No search bar in the topbar. The topbar contains only: notifications icon, settings icon, user avatar.
7. Uppercase section labels (e.g. "UPDATE MODE", "UPLOAD FILE") use `font-size: 0.75rem`, `font-weight: 600`, `letter-spacing: 0.04em`, `color: var(--pt-text-secondary)`. They are not headings — they are field labels.

---

## 2. COLOUR SYSTEM

All colours use `--pt-*` tokens from `theme.css`. Never hardcode a hex that has a token.

### Background surfaces (light to dark reading order)
```
--pt-bg-surface:         #ffffff    Cards, topbar, page header zone. The "white" layer.
--pt-bg-surface-muted:   #fafbfc    Table/card header bands, input fields, muted zones within a white card.
--pt-bg-surface-sunken:  #f1f3f5    Hover states, pressed button states, active row highlights.
--pt-bg-canvas:          #f0f2f5    Page ground. The grey behind all cards. ONLY visible between/around cards.
```

### Borders
```
--pt-border-default:     #dee2e6    All card edges, all input borders, all major zone dividers.
--pt-border-subtle:      #e9ecef    Internal table row dividers, lighter separators within a card body.
```

### Text
```
--pt-text-primary:       #212529    Headings, data values, active nav items, strong labels.
--pt-text-secondary:     #6c757d    Body descriptions, metadata, field labels, placeholder text, inactive nav.
--pt-text-muted:         #adb5bd    Zero-value cells, disabled states, hints, timestamps.
```

### Accent (brand green)
```
--pt-accent:             #2ecc71    Primary buttons, active stepper step, active nav border, active mode tile border.
--pt-accent-border:      #27ae60    Primary button border/hover state.
--pt-accent-soft:        #e8f8f0    Selected mode tile background (e.g. "Change" tile on upload page).
```

### Semantic colours
```
--pt-info:               #0d6efd    "Editing" badge background-text, active edit card border glow.
--pt-info-soft:          #e7f1ff    Info badge background.
--pt-success:            #198754    "Active"/"Paid" badge text.
--pt-success-soft:       #d1e7dd    "Active"/"Paid" badge background.
--pt-danger:             #dc3545    "Cancelled" badge, destructive button text, discard button.
--pt-danger-soft:        #f8d7da    Danger badge background.
--pt-warning:            #ffc107    "Pending" badge.
--pt-warning-soft:       #fff3cd    Pending badge background.
```

---

## 3. TYPOGRAPHY

### Font family
```
"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif
```
Applied globally via `--app-ui-font-family`. Inter is the primary face — clean, neutral, highly legible at small sizes.

### Type scale
```
Page title (h1):          1.05rem  600  --app-title-page-size
Section heading (h2):     1.0rem   600
Sub-section heading (h3): 0.98rem  600  --app-title-section-size
Body / UI default:        0.875rem 400  --pt-font-size-body / --inventory-work-font-size
Labels / secondary:       0.8rem   400  --pt-font-size-label / --inventory-work-font-size-sm
Meta / table headers:     0.75rem  500  --pt-font-size-meta
Buttons (default):        0.88rem  600  --app-button-font-size
Buttons (small):          0.84rem  600  --app-button-font-size-sm
Uppercase field labels:   0.75rem  600  letter-spacing: 0.04em  text-transform: uppercase
```

### Typography rules
- Page titles are `font-weight: 600`, not 700. They are substantial but not heavy.
- Button labels are always `font-weight: 600`.
- Table header cells are `font-weight: 500`, `color: var(--pt-text-secondary)`, `font-size: var(--pt-font-size-meta)`.
- Numeric data in tables uses `font-variant-numeric: tabular-nums` so columns align.
- Zero/empty values in data tables use `color: var(--pt-text-muted)` to recede visually.

---

## 4. LAYOUT SHELL

### Overall structure
```
┌─────────────┬──────────────────────────────────────┐
│             │  TOPBAR (48px, white, border-bottom)  │
│   SIDEBAR   ├──────────────────────────────────────┤
│  (192px,    │  PAGE HEADER (white, border-bottom)   │
│   #1e2d3d)  │  [title + subtitle + actions + stepper│
│             ├──────────────────────────────────────┤
│             │  PAGE CANVAS (--pt-bg-canvas)         │
│             │  [filter bar card + content card(s)]  │
└─────────────┴──────────────────────────────────────┘
```

### Key measurements
- Sidebar width: `192px`
- Topbar height: `48px`
- Page header padding: `16px 24px 0` (zero bottom — stepper sits flush)
- Canvas padding: `20px 24px`
- Max content width: `1100px` (matches `inventory-upload-card`)
- Card border-radius: `var(--pt-radius-lg)` = `10px`

---

## 5. SIDEBAR

### Structure and colours
- Background: `#364f65` (dark blue-gray — stored in `--pt-sidebar-bg` token)
- Brand area: `padding: 14px 16px 12px`, `border-bottom: 1px solid rgba(255,255,255,0.07)`
- Brand avatar: `28×28px` circle, `background: var(--pt-accent)`, white initials, `font-size: 11px`, `font-weight: 600`
- Brand name: `font-size: 13px`, `font-weight: 600`, `color: #ffffff`

### Navigation
- Section labels: `font-size: 10px`, `font-weight: 600`, `color: rgba(255,255,255,0.28)`, `text-transform: uppercase`, `letter-spacing: 0.07em`, `padding: 10px 16px 3px`
- Top-level items: `font-size: 12.5px`, `color: rgba(255,255,255,0.52)`, `padding: 6px 16px`, `border-left: 2px solid transparent`
- Top-level item hover: `color: rgba(255,255,255,0.80)`, `background: rgba(255,255,255,0.04)`
- Top-level item ACTIVE: `color: var(--pt-accent)`, `background: rgba(46,204,113,0.09)`, `border-left-color: var(--pt-accent)`
- Sub-items: `font-size: 12px`, `color: rgba(255,255,255,0.38)`, `padding: 4px 16px 4px 36px`, `border-left: 2px solid transparent`
- Sub-item hover: `color: rgba(255,255,255,0.65)`
- Sub-item ACTIVE: `color: rgba(255,255,255,0.85)`, `font-weight: 600`, `border-left-color: rgba(255,255,255,0.45)`
- Bottom utility items (Settings etc): same style as top-level items, separated by `border-top: 1px solid rgba(255,255,255,0.07)`

### Portal theme nav pattern
Portal uses icon + label for every top-level nav item. Icons are small (16px), inline with text, using PrimeIcons or similar. Sub-items have no icons — indentation signals hierarchy.

---

## 6. TOPBAR

### Structure
- Height: `48px`
- Background: `var(--pt-bg-surface)` (white)
- Border: `border-bottom: 1px solid var(--pt-border-default)`
- Content: `padding: 0 20px`

### Contents — LEFT to RIGHT
1. **Search bar** (Portal theme has this; our app does NOT — omit entirely)
2. **Spacer** pushes icons to the right
3. **Notification bell icon button** — `30×30px`, `border-radius: var(--pt-radius-md)`, with a small red badge dot (`7×7px`, `background: #e74c3c`) when there are unread notifications
4. **Settings gear icon button** — same sizing as bell
5. **User avatar** — `28×28px` circle, `background: var(--pt-accent)`, white initials, `font-size: 10px`, `font-weight: 600`

### Topbar rules
- **No search bar.** The upload page topbar contains no search input. Our app follows this.
- Icon buttons: `background: none`, `border: none`, hover state adds `background: var(--pt-bg-surface-sunken)`

---

## 7. PAGE HEADER

The page header is the white zone between the topbar and the grey canvas. It is NOT a separate card — it is a continuation of the white surface.

### Structure
```
┌─────────────────────────────────────────────────────┐
│ padding: 16px 24px 0                                │
│                                                     │
│  [Page Title h1]          [Action Buttons row]      │
│  [Page subtitle]                                    │
│                                                     │
│  ─────────────────────────────────── (top border)  │
│  [Stepper tabs]                                     │
└─────────────────────────────────────────────────────┘
border-bottom: 1px solid var(--pt-border-default)
background: var(--pt-bg-surface)
```

### Title row
- Title: `font-size: var(--app-title-page-size)` = `1.05rem`, `font-weight: 600`, `color: var(--pt-text-primary)`
- Subtitle: `font-size: var(--pt-font-size-meta)` = `0.75rem`, `color: var(--pt-text-secondary)`, `margin-top: 3px`
- Title and subtitle stack vertically (column), left-aligned
- Action buttons sit on the same row as the title block, pushed right with `margin-left: auto`

### Action buttons (top-right)
- Outlined/default buttons for secondary actions (e.g. "Download Template")
- Green primary button for the page's main action (e.g. "Download Inventory")
- Buttons are `height: 32px`, `font-size: var(--app-button-font-size)`, `font-weight: 600`
- Gap between buttons: `8px`

### Stepper (sub-navigation)
Derived directly from the Upload page and Portal's tab patterns.

```
Stepper sits flush against the bottom of the page header.
border-top: 1px solid var(--pt-border-default)  ← separates stepper from title row
border-bottom: 1px solid var(--pt-border-default)  ← this IS the page header border-bottom
margin-bottom: -1px  ← active step's border-bottom overlaps the container border
```

**Step states:**

| State | Number indicator | Label colour | Bottom border |
|-------|-----------------|--------------|---------------|
| Complete | Green filled circle ✓ | `--pt-text-secondary` | none |
| Active | Green filled circle + number | `--pt-text-primary` | `2px solid var(--pt-accent)` |
| Future | Grey filled circle + number | `--pt-text-muted` | none |

- Number circle: `20×20px`, `border-radius: 50%`
- Active/complete circle: `background: var(--pt-accent)`, `color: #ffffff`
- Future circle: `background: var(--pt-border-default)`, `color: var(--pt-text-secondary)`
- Step label: `font-size: var(--pt-font-size-body)`, `font-weight: 500`
- Step padding: `10px 20px 10px 0` (first step has no left padding)
- Steps are display flex row, gap handled by padding

---

## 8. PAGE CANVAS

The grey ground (`var(--pt-bg-canvas)`) that appears below the page header. All content cards float on this surface.

- `padding: 20px 24px`
- Cards on the canvas have `background: var(--pt-bg-surface)` (white) with `border: 1px solid var(--pt-border-default)` and `border-radius: var(--pt-radius-lg)`
- The contrast between canvas and cards is intentionally subtle — this is not a strong grey; it is barely-there
- `max-width: 1100px` for main content cards (matches `inventory-upload-card`)

---

## 9. CARDS

### Standard content card
```css
background: var(--pt-bg-surface);
border: 1px solid var(--pt-border-default);
border-radius: var(--pt-radius-lg);  /* 10px */
box-shadow: none;
overflow: hidden;
```

### Card internal anatomy (from upload page)
Cards have internal zones, each separated by `border: 1px solid var(--pt-border-default)`:

1. **Card body** — white, `padding: 16px`
2. **Section label** — uppercase, `0.75rem`, `600`, `letter-spacing: 0.04em`, `color: var(--pt-text-secondary)`, `margin-bottom: 8px`
3. **Card footer** — `background: var(--pt-bg-surface)`, `border-top: 1px solid var(--pt-border-default)`, `padding: 12px 16px`, flex row: tertiary action left, primary pair right

### Card footer button pattern (from upload page)
```
[Tertiary action — muted/disabled]    [Secondary]  [Primary green]
Export Issues                         Validate File  Upload Inventory
```
- Tertiary action is left-aligned, `color: var(--pt-text-muted)`, disabled appearance
- Primary pair is right-aligned with `margin-left: auto`
- `gap: 8px` between footer buttons

### Section within a card
Internal sections use uppercase labels:
```
UPDATE MODE          ← section label
[tile][tile][tile]   ← content

UPLOAD FILE          ← section label
[dropzone]           ← content
```

---

## 10. BUTTONS

### Sizes
```
Default:  height 32px, padding 0 14px, font-size 0.88rem, font-weight 600
Small:    height 28px, padding 0 11px, font-size 0.84rem, font-weight 600
Icon:     32×32px (default) or 28×28px (small), padding 0
```

### Variants
```
Default/outlined:  border: 1px solid var(--pt-border-default)
                   background: var(--pt-bg-surface)
                   color: var(--pt-text-primary)
                   hover: background var(--pt-bg-surface-sunken)

Primary:           background: var(--pt-accent)
                   border-color: var(--pt-accent-border)
                   color: #ffffff
                   hover: background #27ae60

Danger outlined:   color: var(--pt-danger)
                   border-color: var(--pt-danger)
                   background: transparent
                   hover: background var(--pt-danger-soft)

Text/link:         background: none, border: none
                   color: var(--pt-text-secondary)
                   hover: color var(--pt-text-primary)
```

### Border radius
All buttons: `var(--pt-radius-md)` = `6px`

### View/mode switching — ALWAYS use segmented button groups
Portal uses button groups for switching between views or modes. Never use a toggle switch for this purpose. Toggle switches are for binary on/off settings only (e.g. "Enable notifications").

```
Segmented button group:
border: 1px solid var(--pt-border-default)
border-radius: var(--pt-radius-md)
overflow: hidden

Each button within:
height: 30px, padding: 0 14px
border: none, border-right: 1px solid var(--pt-border-default) (except last)
background: var(--pt-bg-surface)
color: var(--pt-text-secondary)
font-size: var(--pt-font-size-meta), font-weight: 600

Active button within group:
background: var(--pt-bg-surface-sunken)
color: var(--pt-text-primary)
```

---

## 11. MODE SELECTION TILES

Used on the Upload page for "Change / Add / Subtract". Pattern for any exclusive-choice selection.

```
Container: display flex, gap 0, equal-width children, border: 1px solid var(--pt-border-default), border-radius: var(--pt-radius-md)

Each tile:
  flex: 1
  padding: 16px 12px
  text-align: center
  cursor: pointer
  border-right: 1px solid var(--pt-border-default)  (except last)
  background: var(--pt-bg-surface)

  Icon: displayed above label, ~20px, color: var(--pt-text-secondary)
  Label: font-size var(--pt-font-size-body), font-weight: 600, color: var(--pt-text-primary)
  Subtext: font-size var(--pt-font-size-meta), color: var(--pt-text-secondary)

SELECTED tile:
  background: var(--pt-accent-soft)
  border-color: var(--pt-accent)
  Icon/subtext color: var(--pt-accent)
```

---

## 12. FORM ELEMENTS

### Inputs
```
height: 32px (default), 30px (compact/filter context)
padding: 0 10px (no icon) / 0 10px 0 30px (with leading icon)
border: 1px solid var(--pt-border-default)
border-radius: var(--pt-radius-md)
background: var(--pt-bg-surface-muted)
font-size: var(--pt-font-size-body) or var(--pt-font-size-meta) in filter contexts
color: var(--pt-text-primary)
font-family: inherit
outline: none
```

### Textarea
```
Same border/radius/background as input
padding: 8px 10px
font-size: var(--pt-font-size-meta)
resize: vertical
```

### Select
```
Same as input + appearance: none
padding-right: 22px (space for custom chevron or browser arrow)
cursor: pointer
```

### Checkboxes (from upload page)
Standard Bootstrap 5 form-check. Label `font-size: var(--pt-font-size-body)`, `color: var(--pt-text-primary)`.

### Dropzone (upload page pattern)
```
border: 2px dashed var(--pt-border-default)
border-radius: var(--pt-radius-md)
background: var(--pt-bg-surface)
padding: 40px 20px
text-align: center
cursor: pointer

Upload icon: ~32px, color: var(--pt-text-muted)
Primary label: font-size var(--pt-font-size-body), font-weight: 600, color: var(--pt-text-primary)
Secondary label: font-size var(--pt-font-size-meta), color: var(--pt-text-muted)
```

---

## 13. FILTER BAR

The filter bar lives on the canvas, above the main content card. It IS itself a card.

```css
background: var(--pt-bg-surface);
border: 1px solid var(--pt-border-default);
border-radius: var(--pt-radius-lg);
padding: 11px 14px;
display: flex;
align-items: center;
gap: 10px;
flex-wrap: wrap;
margin-bottom: 16px;
max-width: 1100px;
```

### Filter bar contents (left to right)
1. Search input with leading icon (flex: 1, max-width ~320px)
2. Select dropdowns for filter dimensions (e.g. season, status)
3. "Clear" text button
4. **Right side** (margin-left: auto): summary text ("Showing N items") + view toggle button group

---

## 14. TABLES

### Header row
```
background: var(--pt-bg-surface-muted)
font-size: var(--pt-font-size-meta)
font-weight: 500
color: var(--pt-text-secondary)
border-bottom: 1px solid var(--pt-border-default)
padding: 5px 4px
```

### Data rows
```
border-bottom: 1px solid var(--pt-border-subtle)
font-size: var(--inventory-work-font-size)  (0.875rem)
padding: 5px 4px
vertical-align: middle
hover: background var(--pt-bg-surface-sunken)
last row: no border-bottom
```

### Numeric columns
- Right-aligned
- `font-variant-numeric: tabular-nums`
- Zero values: `color: var(--pt-text-muted)` — they should visually recede
- Non-zero values: `color: var(--pt-text-primary)`, `font-weight: 500` for totals

### Total column
Separated from size columns by `border-left: 1px solid var(--pt-border-default)`, `padding-left: 8px`, `font-weight: 600`

### Colour swatches in tables
```
width: 10px, height: 10px
border-radius: var(--pt-radius-pill)
border: 1px solid rgba(0,0,0,0.18)
display: inline-block
margin-right: 5px
vertical-align: middle
```

---

## 15. BADGES / STATUS PILLS

```
display: inline-flex
align-items: center
font-size: 11px
font-weight: 600
padding: 2px 8px
border-radius: var(--pt-radius-pill)
```

| Status | Background | Text colour |
|--------|-----------|-------------|
| Active / Paid | `--pt-success-soft` #d1e7dd | `#0a5534` |
| Editing | `--pt-info-soft` #e7f1ff | `#084298` |
| Pending | `--pt-warning-soft` #fff3cd | `#664d03` |
| Cancelled / Error | `--pt-danger-soft` #f8d7da | `#842029` |
| Inactive / Muted | `--pt-bg-surface-muted` | `--pt-text-secondary` |

Tags/column pills (e.g. "Style", "Color", "size columns" on the upload page):
```
background: var(--pt-bg-surface-muted)
border: 1px solid var(--pt-border-default)
border-radius: var(--pt-radius-sm)  (4px — squarer than status pills)
font-size: 11px, font-weight: 600
padding: 2px 7px
color: var(--pt-text-primary)
```

---

## 16. NOTIFICATIONS PANEL (PORTAL PATTERN)

From Portal's notifications dropdown in the topbar:
- Appears as an overlay panel
- Each notification: avatar/icon left, category badge + heading + timestamp + body text
- Category badges: coloured pill (Project = blue, Billing = yellow, News = green)
- Timestamp + author in muted meta text below heading
- "View all" / "View invoice" links in `var(--pt-accent)` green
- Panel has a "Load more" button at bottom

---

## 17. NOTIFICATION PAGE (PORTAL PATTERN)

From Portal's `/notifications.html`:
- Page title "Notifications" with filter dropdown top-right ("All / News / Product / Project / Billing")
- Each notification is a full-width card block with: avatar left, badge + heading + meta row, body text, action link
- Cards separated by bottom border only (no individual card borders)
- Avatar: 48px circle with image or icon
- Heading: `font-size: 1rem`, `font-weight: 600`
- Meta row: timestamp | author — `font-size: var(--pt-font-size-meta)`, `color: var(--pt-text-secondary)`

---

## 18. SETTINGS PAGE (PORTAL PATTERN)

From Portal's `/settings.html`:
- Page title "Settings"
- Sections separated by `<hr>` (full-width rule)
- Each section: `h3` section title + intro paragraph + form fields + "Save Changes" button
- Form fields are full-width, stacked vertically with labels above
- Section intro text: `font-size: var(--pt-font-size-body)`, `color: var(--pt-text-secondary)`
- "Save Changes" button: default outlined style, NOT primary green (green is reserved for the most important action per page)

---

## 19. ACCOUNT PAGE (PORTAL PATTERN)

From Portal's `/account.html`:
- Groups of settings in cards: Profile, Preferences, Security, Payment methods
- Each item in a group: bold label left, value centre, "Change"/"Edit" link right
- "Manage X" button at bottom of each card group — outlined style
- Clean two-column feel within each card (label | value | action)

---

## 20. HELP PAGE (PORTAL PATTERN)

From Portal's `/help.html`:
- Two-column layout: main content (FAQ accordion) left, sidebar right
- Sidebar cards: "Need more help?" with contact details + CTA, "Want to upgrade?" with bullet list + CTA
- FAQ sections grouped by category label
- Questions as `h2` headings within accordions
- Sidebar CTAs use primary green button

---

## 21. AUTH PAGES (PORTAL PATTERN)

From Portal's `/login.html`, `/signup.html`, `/reset-password.html`:
- Centred single-column layout, no sidebar, no topbar
- Logo at top
- White card containing the form, centred on a light grey page background
- Form title: `h2`, `font-weight: 600`
- Fields stacked with labels above
- Primary action button full width, green
- Secondary links below button in `font-size: var(--pt-font-size-meta)`
- Right column (Portal has a marketing blurb column) — optional for this app

---

## 22. INVENTORY-SPECIFIC PATTERNS

### Style group card (list view)
```
Container:
  border: 1px solid var(--pt-border-default)
  border-radius: var(--pt-radius-lg)
  overflow: hidden
  margin-bottom: 10px

  EDITING state:
    border-color: var(--pt-info)
    box-shadow: 0 0 0 2px rgba(13,110,253,0.10)   ← ONLY place box-shadow is permitted
    Do not increase opacity or spread — it must be subtle.

Header band:
  background: var(--pt-bg-surface-muted)
  border-bottom: 1px solid var(--pt-border-subtle)
  padding: 10px 14px
  display: flex, align-items: flex-start, justify-content: space-between

  Left side:
    Style number: font-size 15px, font-weight 700
    Status badge: inline after style number
    Description: font-size var(--pt-font-size-meta), color var(--pt-text-secondary)
    Meta row: Stock N · Wholesale — · Retail — in meta size, secondary colour

  Right side:
    Edit icon button (pencil) + more icon button (⋮) when idle
    "✓ Done Editing" small button when in edit state

Matrix body:
  padding: 0 14px 12px

Edit footer (only shown in editing state):
  display: flex, align-items: center, gap: 8px
  margin-top: 12px, padding-top: 12px
  border-top: 1px solid var(--pt-border-subtle)
  Layout: [⬇ Download] [✕ Discard]  ············  [💾 Save]
```

### Editing sticky banner
```
background: var(--pt-bg-surface-muted)
border-bottom: 1px solid var(--pt-border-default)
padding: 8px 16px
font-size: var(--pt-font-size-meta)

"Editing style" — color: var(--pt-text-secondary), font-weight: 500
"1102" — color: var(--pt-text-primary), font-weight: 600, font-size: var(--inventory-work-font-size)
```

### Upload mode tiles
Three equal tiles: Change / Add / Subtract
- Selected: `background: var(--pt-accent-soft)`, `border-color: var(--pt-accent)`
- Selected subtext and icon: `color: var(--pt-accent)`
- Unselected: white background, default border

### Two-column page layout (upload page)
```
display: grid
grid-template-columns: minmax(0, 1fr) 256px
gap: 16px
align-items: start
max-width: 1280px (two-col pages may be wider than 1100px)
```

Right sidebar rail contains contextual help cards with the same card treatment as main cards.

---

## 23. SPACING SYSTEM

Derived from Portal theme and upload page observation:

```
4px   — tight internal gaps (badge padding, icon margins)
8px   — button gaps, small element spacing
10px  — card internal row gaps
12px  — section padding, footer gaps
14px  — card body padding horizontal
16px  — standard card padding, canvas padding unit
20px  — canvas padding, topbar padding
24px  — page header padding horizontal
```

Vertical rhythm uses `rem`:
- Between page sections: `1rem` (16px)
- Between cards on canvas: `16px`
- Between rows within a card: `10–12px`

---

## 24. WHAT PORTAL DOES — AND WE FOLLOW

Observed consistently across all Portal pages:

1. **Page title is always an `h1`, left-aligned, in the page header zone** — never inside a card
2. **Cards never have headers with coloured backgrounds** — card header bands use `--pt-bg-surface-muted` (very light grey), never accent colours
3. **Links within content use `var(--pt-accent)` green** — "More charts", "View all", "View invoice"
4. **Pagination** uses Bootstrap pagination: Previous · 1 · 2 · 3 · Next, with current page in filled dark pill
5. **Tab filters** (Orders page: All / Paid / Pending / Cancelled) sit below the page title, above the table, with green underline on active tab — same stepper pattern
6. **Dropdown filters** (Docs page: "All / Text file / Image...") use standard select or pill button group
7. **No modal overlays** for simple actions — inline editing is preferred
8. **"Create New" / primary CTA buttons** are always green, always right-aligned or end-of-flow
9. **Section headings within cards** (`h4` / `h5`) are `font-weight: 600`, not uppercase
10. **Sidebar bottom items** (Settings, Download, License in Portal) are separated from nav by a border-top rule

---

## 25. WHAT WE DO NOT DO (NEVER LIST)

- ❌ Drop shadows on any element
- ❌ Gradients anywhere
- ❌ Toggle switches for view/mode switching (use segmented button groups)
- ❌ Search bar in the topbar
- ❌ Inline `style=""` attributes
- ❌ Coloured card header backgrounds (accent, info, etc.)
- ❌ Borders with radius on single-sided borders
- ❌ Uppercase for section headings inside cards (only for field labels above inputs)
- ❌ Font weights above 600
- ❌ Font sizes below 11px
- ❌ Right sidebar on inventory list/cards views (single column only)
- ❌ Toggle switch pattern for List/Cards view switching
- ❌ Browser focus rings on custom tab/toggle button elements — always set `outline: none`, `box-shadow: none`, `appearance: none` on custom `<button>` elements used as tabs or segmented controls, plus `:focus` and `:focus-visible` pseudo-classes

---

## 26. CSS CLASS NAMING CONVENTIONS

From `theme.css` — use these exact class names, never invent synonyms:

```
Layout:         .app-layout  .content-wrapper  .content-container  .page-container
Header:         .portal-page-header  .portal-page-header__title  .portal-page-header__subtitle
                .portal-page-header__actions  .content-topbar  .content-topbar-inner
Cards:          .portal-content-card  .content-card  .inventory-edit-card
                .inventory-edit-card-body  .inventory-edit-card-body--split
                .inventory-edit-card-footer
Filter bar:     .page-filters-shell  .page-filters-row  .page-filters-search
                .page-filters-quick  .page-filter-field  .page-filters-actions
Inventory:      .inventory-edit-table  .inventory-color-col  .inventory-size-col
                .inventory-color-chip  .inventory-color-swatch-chip  .inventory-color-name
                .inventory-style-group  .inventory-style-group-style
                .inventory-style-group-description  .inventory-style-group-supportline
                .inventory-card-meta-row  .inventory-card-header-topline
                .inventory-editing-sticky  .inventory-editing-sticky-label
                .inventory-cards-grid  .inventory-upload-card  .inventory-upload-mode-group
Upload:         .upload-section-header  .items-upload-actions  .items-upload-header
View toggle:    .inventory-view-toggle  .inventory-view-toggle-label
                .inventory-view-switch  .inventory-view-switch-track
History:        .inventory-history-card  .inventory-history-card-header
                .inventory-history-delta  (positive / negative modifier classes)
Scan:           .scan-page  .scan-section  .scan-section-icon  .sku-scan-input
Badges:         .badge + .badge-success / .badge-info / .badge-danger / .badge-warning
```

---

## 27. HOW TO START A NEW PAGE

When designing any new inventory sub-page, follow this checklist:

1. **Shell:** Dark sidebar (`#1e2d3d`) + white topbar (no search) + user avatar/icons right
2. **Page header:** White zone, `h1` title + subtitle left, action buttons right, stepper below
3. **Canvas:** Grey (`--pt-bg-canvas`), `padding: 20px 24px`
4. **Filter bar** (if page has filtering): White card on canvas, full-width up to `1100px`, search + filters + view toggle
5. **Main content:** White card(s) on canvas, `border-radius: 10px`, `border: 1px solid --pt-border-default`, `max-width: 1100px`
6. **No shadows. No gradients. No inline styles.**
7. **Buttons:** Default outlined for secondary, green primary for the one main action per page
8. **Check against upload page:** Does it feel like the same designer made both?

---

## 31. PERMITTED INLINE STYLES (complete list)

Only these two inline styles are permitted anywhere in the codebase:

1. **Color swatch backgrounds:**
   ```tsx
   style={{ backgroundColor: getSwatchColor(colorName) }}
   ```
   Reason: runtime-computed color value, cannot be a CSS class
   Locations: `InventoryCardTable.tsx` swatch chip elements; `InventoryEditCard.tsx` color chip row in card header

2. **PrimeReact Dialog sizing:**
   ```tsx
   style={{ width: '...', height: '...' }}
   ```
   Reason: PrimeReact Dialog root element has no PassThrough CSS class hook
   Location: `Dialog` component instances only

3. **Inventory style group card shadow:**
   ```css
   box-shadow: 0 1px 3px rgba(0,0,0,0.06)
   ```
   This is the second permitted box-shadow in the app.
   Applied to `.inventory-style-group` only.
   Purpose: subtle card lift on gray canvas.
   Do not increase opacity or spread.

Every other inline style is a violation. If you find yourself needing an inline style, stop and add a CSS class to `portal-theme.css` instead.

---

*End of specification — v1.0*
*Reference: https://themes.3rdwavemedia.com/demo/portal/ (all pages) + Upload Inventory screenshot*

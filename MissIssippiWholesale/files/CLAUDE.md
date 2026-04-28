# MissIssippi Full-Stack Architecture Rules (Claude Optimized)

---

## 1. Core Principle (ABSOLUTE RULE)

All systems must follow:

> UI renders data → Hooks manage logic → Backend owns truth

No layer may bypass its responsibility.

---

# FRONTEND ARCHITECTURE

---

## 2. Pages Layer (Routing + Orchestration ONLY)

**Location:** `src/pages/*`, `src/inventory/*`, `src/colors/*`

### Responsibilities
- Compose UI layout
- Call hooks
- Pass props to components
- Trigger UI side effects (toast, modal)

### Forbidden
- API calls
- Business logic
- Data transformation beyond trivial mapping
- State ownership outside hooks

---

## 3. Feature Hooks Layer (BUSINESS LOGIC CORE)

### Responsibilities
- API calls
- State management
- Validation logic
- Data shaping / normalization
- Error handling

### Standard Hook Output
```ts
{
  data,
  loading,
  error,
  actions
}
Rule

All JSON shaping and transformation MUST happen here.

4. Components Layer (PURE UI)
Responsibilities
Render UI only
Receive props
Call callbacks
Forbidden
API calls
Business logic
State mutation
Data reshaping
BACKEND ARCHITECTURE
5. Controllers
Responsibilities
Receive request
Validate input
Call services
Return response
Rule

Controllers must stay thin.

6. Services (BUSINESS LOGIC LAYER)
Responsibilities
All business logic
Reusable across endpoints
No HTTP awareness
7. Data Layer
Responsibilities
DB queries only
No business logic allowed
8. API RESPONSE CONTRACT (STRICT)

All responses MUST follow:

{
  "success": true,
  "data": {},
  "error": null
}
Error format
{
  "success": false,
  "data": null,
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message"
  }
}
Rule

Never return raw database objects directly.

INTEGRATION RULES (FRONT ↔ BACK)
9. Single Source of Truth

Backend defines structure.
Frontend adapts ONLY inside hooks.

10. Contract Stability Rule
Any backend response change MUST be handled in hooks
Never break components due to API changes
Version or adapt — never break downstream UI
11. JSON SAFETY RULE (CRITICAL FIX FOR CLAUDE ERRORS)
MUST
Transform data in hooks or backend services
Keep components pure UI only
Avoid inline object reshaping in JSX
Avoid duplicate data shaping layers
ERROR HANDLING STANDARD
12. Frontend Error Normalization

Hooks must normalize errors:

{
  message: string,
  code?: string
}
ANTI-PATTERNS (DO NOT ALLOW)
API calls inside components
Business logic inside pages
Inline JSON transformation in UI
Multiple conflicting data sources
Backend response shape inconsistency
DB access outside services
UI deciding backend structure
CLAUDE / AI INSTRUCTION RULES

When generating or modifying code:

Always ask:

"Is this logic in the correct layer?"

Enforce:

UI = presentation only
Hooks = logic + shaping
Services = business logic
Controllers = routing only
Data layer = persistence only

## Shared Components Registry

- `ColorDot` — shared color dot component
  Location: src/components/ColorDot.tsx
  Usage: `<ColorDot colorName="GREEN" hexColor={row.hexValue} size="sm|md|lg" />`
  Always pass `hexColor` when the data object has a `hexValue` field
  ColorDot calls `resolveSwatchColor` internally — never call getSwatchColor directly in UI

- `resolveSwatchColor(colorName, hexColor?)` — canonical color value resolver
  Location: src/utils/swatchColor.ts
  Priority: stored hexColor → CSS named color → hash-based HSL fallback
  Use this wherever a CSS color string is needed (inline styles for swatches, pills, etc.)
  Never inline the hex-or-fallback logic elsewhere
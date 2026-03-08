# PayOnRain — Production Figma Design Spec

**Target**: Clean, modern web2 insurance platform. Professional but approachable. No blockchain language.

---

## LOGO & BRANDING

### Rialo Logo Style
- **Aesthetic**: Modern, geometric, organic curves (abstract)
- **Color**: Black (`#1a1714`) + Cream (`#f5f1e8`)
- **Concept**: Flowing shapes suggesting motion, connectivity, technology
- **Mood**: Trustworthy, innovative, forward-thinking

### Logo Variants

**1. Logo Mark Only** (icon)
- 48×48px minimum
- Black abstract shape on cream or white background
- Use in favicons, app icons

**2. Logo + Wordmark** (full)
- Horizontal layout: mark + "Rialo" text
- Text: 20px Bold, `#1a1714`
- Space between: 12px
- Min width: 160px
- Use in header, documents

**3. Logo + "Say Hello to Rialo"** (hero)
- Tagline: 28px Medium, white text
- Background: Black (`#1a1714`) or gradient
- Logo: Cream/white
- Use on splash/hero screens

### Header Integration (PayOnRain App)

```
┌──────────────────────────────────────────────────┐
│ [Rialo Mark] PayOnRain    [Sign In]              │
└──────────────────────────────────────────────────┘
```

**Specs**:
- Rialo mark: 32×32px, placed left
- Padding: 8px right of mark
- "PayOnRain" text: 20px Bold, `#1a1714`
- Visual hierarchy: Rialo (brand), PayOnRain (product)

### Color Usage in UI

- **Logo Mark**: Black (`#1a1714`) on light bg, White/Cream on dark bg
- **Accent Shapes**: Can pull secondary color (`#E91E63`) for geometric accents in backgrounds
- **Pay OnRain Logotype**: Should complement Rialo style (same geometric, flowing aesthetic)

### Design Asset List

To build in Figma:
- [ ] Rialo mark (abstract geometric shape)
- [ ] Rialo wordmark ("Rialo" text + mark combined)
- [ ] PayOnRain logotype (clean, modern sans-serif)
- [ ] Hero variant ("Say Hello to Rialo" + mark)
- [ ] Favicon (32×32px, mark only)
- [ ] Social media og:image (1200×600px, mark + tagline)

---

## COLOR SYSTEM

| Token | Value | Use |
|-------|-------|-----|
| Primary Action | `#00A878` | Buttons, CTAs, success states |
| Secondary | `#E91E63` | Accents, highlights |
| Text Primary | `#1a1714` | Headlines, body copy |
| Text Secondary | `#6b6b6b` | Labels, muted text |
| Text Muted | `#999999` | Disabled, hints |
| Bg Default | `#f5f1e8` | Page background |
| Bg Card | `#ffffff` | Cards, inputs |
| Border | `#e0dcd4` | Dividers, input borders |
| Success | `#6ee7b7` | Positive states |
| Error | `#f87171` | Alert/error states |

---

## TYPOGRAPHY

**Font Stack**: Inter, Poppins, -apple-system, sans-serif  
**Monospace**: Cascadia Code, Fira Code (for IDs, emails)

| Level | Size | Weight | Line Height |
|-------|------|--------|------------|
| H1 | 36px | 700 | 1.2 |
| H2 | 28px | 700 | 1.25 |
| H3 | 20px | 600 | 1.4 |
| Body L | 16px | 400 | 1.6 |
| Body M | 14px | 400 | 1.6 |
| Label | 12px | 600 | 1.4 |
| Code | 12px | 400 | 1.5 |

---

## SPACING

Grid: **8px base**

- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

Layout: Max 720px centered, 20px padding on mobile

---

## COMPONENTS

### Buttons

**Primary** (CTA)
- Background: `#00A878`
- Text: White, 14px Bold
- Padding: 12px 24px
- Radius: 8px
- Hover: `#008060` (darker)
- Active: `scale(0.98)`
- Disabled: `#d1d1d1`, opacity 0.5

**Secondary** (outline)
- Border: 2px `#E91E63`
- Text: `#E91E63`, 14px
- Background: transparent
- Hover: Bg `rgba(233,30,99,0.1)`

### Input Fields

- Background: `#ffffff`
- Border: 1px `#e0dcd4`
- Padding: 12px 14px
- Radius: 6px
- Font: 14px Inter
- Focus: Border `#00A878`, shadow `0 0 0 3px rgba(0,168,120,0.1)`

### Selects (Dropdowns)

Same as inputs. Style like native select.

### Cards

- Background: `#ffffff`
- Border: 1px `#e0dcd4`
- Radius: 12px
- Padding: 28px 24px
- Shadow: `0 2px 8px rgba(0,0,0,0.04)`
- Hover: Shadow `0 4px 16px rgba(0,0,0,0.08)`

### Modal

- Backdrop: `rgba(0,0,0,0.5)`, fixed overlay
- Content: Card + `#ffffff` bg, centered
- Max width: 420px
- Header: 24px padding, close button top-right
- Body: 24px padding
- Footer: 12px padding, top border `#e0dcd4`

---

## SCREEN 1: HEADER

```
┌─────────────────────────────────────────────────────────┐
│ [Rialo◆] PayOnRain                  [Sign In Button]    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Logo Area** (Left)
- Rialo mark: 32×32px, black geometric shape
- Spacing: 8px right of mark
- "PayOnRain" text: 20px Bold, `#1a1714`
- Combined lockup width: ~140px
- Vertical center-aligned

**Sign In Button** (Right)
- Primary button style
- Text: "Sign In"
- Onclick: opens auth modal
- When logged in: shows email like "user@example"

**Header Specs**
- Padding: 18px 40px (desktop), 16px 20px (mobile)
- Border bottom: 1px `#e0dcd4`
- Sticky/fixed (optional)
- Bg: `#ffffff`
- Flex: space-between alignment

---

## SCREEN 2: AUTH MODAL

```
┌────────────────────────────────┐
│ Sign In to PayOnRain       [×]  │
├────────────────────────────────┤
│                                │
│ Email Address                  │
│ [user@example.com________]     │
│                                │
│ Password                       │
│ [••••••••________________]      │
│                                │
│ Preferred Payout Method        │
│ [Bank Account ▼ ____________]  │
│   - Bank Account (ACH/Wire)    │
│   - PayPal                     │
│   - Bitcoin                    │
│   - USDC Stablecoin            │
│                                │
│        [Sign In Button]        │
│                                │
├────────────────────────────────┤
│ Demo: Any email/pw works       │
└────────────────────────────────┘
```

**Modal Specs**
- Width: 100% (mobile), 420px (desktop)
- Header: 24px padding, `#1a1714` H3, close button
- Form rows: 20px gap
- Labels: 12px Bold, `#6b6b6b`, 6px margin below
- Inputs: Full width, 12px padding
- Select: Full width, same styling
- Button: Full width, primary style, 14px
- Footer: Smaller text, centered, `#999999`

---

## SCREEN 3: STEP 1 — CREATE POLICY

```
┌─────────────────────────────────┐
│ Step 1 — Create Insurance       │
│                                 │
│ Set Your Coverage               │
│                                 │
│ City / Location                 │
│ [Nairobi_________________]      │
│                                 │
│ Rain Threshold (mm)             │
│ [50.0__________________]        │
│                                 │
│ Payout Amount (USD)             │
│ [$500_________________]         │
│                                 │
│    [Create Policy]              │
│                                 │
│ [Policy Details - hidden until] │
│  [button clicked]               │
│                                 │
└─────────────────────────────────┘
```

**Card Specs**
- Locked state (before auth): Opacity 0.5, pointer-events: none
- Unlocked state: Full opacity, interactive
- Step label: 12px Bold, `#E91E63`, uppercase, margin bottom 8px
- H3 title: 20px Bold, margin bottom 20px
- Form rows: gap 20px
- Button: Primary, below inputs

**Policy Details (shown after create)**
- Margin top: 24px
- Bg: `#f9f7f4`
- Padding: 16px
- Rounded: 8px
- 4 lines of info (Location, Threshold, Payout, Status)
- Font: 14px mono for values

---

## SCREEN 4: STEP 2 — CHECK WEATHER

```
┌─────────────────────────────────┐
│ Step 2 — Check Conditions       │
│                                 │
│ Evaluate Your Policy            │
│                                 │
│ We'll check real-time weather   │
│ data. If conditions met, payout │
│ processes immediately.          │
│                                 │
│  [Check Weather Now]            │
│                                 │
│ ┌─ Weather Results ─────────┐  │
│ │ Location       Nairobi    │  │
│ │ Rainfall       62.3 mm ✓  │  │  ← Color changes based on trigger
│ │ Threshold      50.0 mm    │  │
│ │ Condition      Rain       │  │
│ │ Temperature    18°C        │  │
│ └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

**Card Specs**
- Locked until Step 1 complete
- H3: "Evaluate Your Policy"
- Hint text: 14px, `#6b6b6b`, margin bottom 16px
- Button: Primary, full width (optional)

**Weather Box**
- Margin top: 20px (hidden by default)
- Background: `#fafaf9` or light tint
- Border: 1px `#e0dcd4`
- Padding: 16px
- Rounded: 8px

**Weather Rows**
- Display: flex, space-between
- Padding: 10px 0
- Border bottom: 1px `#f0f0f0` (except last row)
- Labels: 14px, `#6b6b6b`
- Values: 14px Bold, `#1a1714`
- Rainfall text: Green `#6ee7b7` if triggered, Red `#f87171` if not

---

## SCREEN 5: STEP 3 — PAYOUT CONFIRMATION

```
┌─────────────────────────────────┐
│ Step 3 — Your Settlement        │
│                                 │
│ Payout Status                   │
│                                 │
│           ✓                     │
│   Payout Confirmed              │
│   $500 USD to PayPal            │
│                                 │
│ ┌─ Transaction Details ────────┐│
│ │ Transaction ID              ││
│ │ TXN-1709629380-A4X3Y ••     ││
│ │                              ││
│ │ Recipient Email              ││
│ │ user@example.com             ││
│ │                              ││
│ │ Amount                        ││
│ │ $500 USD                      ││
│ │                              ││
│ │ Payout Method                 ││
│ │ PayPal                        ││
│ │                              ││
│ │ Processing Fee                ││
│ │ Free                          ││
│ │                              ││
│ │ Confirmation                  ││
│ │ View Email Confirmation ↗    ││
│ └──────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

**Payout Status**
- Locked until Step 2 complete
- Center-aligned
- Icon: Checkmark ✓ (48px, `#6ee7b7`), animated scale-in
- Message: 18px Bold, `#1a1714`
- Detail: 14px, `#6b6b6b`, margin top 8px

**Transaction Box**
- Margin top: 24px
- Background: `#1a1714` (dark)
- Color: `#e0e0e0`
- Padding: 16px
- Rounded: 8px
- Border: 1px `#333333`

**TX Rows**
- flex, space-between
- Padding: 8px 0
- Label: 12px, left-aligned
- Value: 12px mono, right-aligned

---

## RESPONSIVE BREAKPOINTS

### Mobile (< 640px)
- Padding: 20px (all containers)
- Max width: 100%
- Card padding: 20px
- Modal width: 90%
- Header: 16px padding
- H2: 24px
- H3: 18px

### Tablet (640–1024px)
- Width: 90%, max 600px
- Card padding: 24px
- Header: 18px padding
- Spacing: md (16px)

### Desktop (> 1024px)
- Width: 720px, centered
- Card padding: 28px
- Header: 40px padding
- All as specified above

---

## INTERACTION & ANIMATION

| Element | Trigger | Duration | Effect |
|---------|---------|----------|--------|
| Button | Hover | 200ms | BG darker, -2px translate |
| Button | Click | 100ms | scale(0.98) |
| Button | Loading | Loop 1s | Spin ⟳ icon |
| Input | Focus | 200ms | Border green, shadow glow |
| Card | Unlock | 400ms | Opacity 0→1, slideDown |
| Icon | Success | 600ms | Scale 0→1.2→1 (spring) |
| Weather Row | Change | 300ms | Text color crossfade |

---

## LOCKED / UNLOCKED STATES

**Locked Card**
- Opacity: 0.5
- Pointer: not-allowed
- Text color: muted
- All interactive: disabled
- Border: same

**Unlocked Card**
- Opacity: 1.0
- Pointer: auto
- All interactive: enabled
- Subtle glow on focus

---

## ACCESSIBILITY

- [ ] Color contrast ≥ 4.5:1 (WCAG AA)
- [ ] focus-visible on all interactive
- [ ] Labels associated with inputs
- [ ] Error messages inline + icon
- [ ] Keyboard nav logical
- [ ] No keyboard traps
- [ ] Screen reader: alt text, ARIA labels

---

## PRODUCTION NOTES

**Logo Placeholder**
- Simple mark (cloud + raindrop)
- OR full logotype "PayOnRain"
- Aim for 100–180px width

**No Demo Language**
- Remove all "demo", "simulation", blockchain references
- Clean copy: "Check real-time weather data"
- Professional tone throughout

**Form Behavior**
- Email/Password: standard HTML5 validation
- Payout method: persists in user session/localStorage
- Inputs: debounce on large text input (optional)

**Error Handling**
- Inline error message below input, red icon
- Modal error: alert or inline banner
- Retry button if network fails

**Success Path**
- Green checkmark animation on payout
- Confirmation email sent (simulate with "View Email")
- Clear next steps or "Done" state

---

## FIGMA SETUP CHECKLIST

- [ ] Create main file "PayOnRain — Production"
- [ ] Set up **Color Styles** (13 colors from table above)
- [ ] Set up **Text Styles** (8 levels)
- [ ] Create **Components**:
  - Button/PrimaryButton (+ hover/active/disabled/loading variants)
  - Button/Secondary
  - Input (+ focus variant)
  - Select/Dropdown
  - Card
  - Modal + Modal.Header/Body/Footer
  - Weather.Row
  - TX.Row
- [ ] Create **Frames** for each breakpoint:
  - Mobile (375px)
  - Tablet (768px)
  - Desktop (1280px)
- [ ] Build all 6 screens (Header, Auth Modal, Step 1–3)
- [ ] Add interaction notes (hover states, transitions)

---

## NEXT: CSS Implementation

Once Figma is complete:
1. Export component specs
2. I'll match CSS variables + layout to pixel-perfect specs
3. Ready to deploy


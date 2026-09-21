# Poorna's Kitchen — Staff Console
### UI/UX case study and developer handoff

---

## 1. Project overview

A counter-side web console that lets a Poorna's Kitchen staff member find a customer by phone number, record a visit, and apply the discount when a five-visit loyalty card is complete. The printed stamp card stays exactly as it is; this system is the shop's own reliable record of it.

Deliverable in this package: a static HTML/CSS/JS prototype covering every screen and state, plus this handoff.

---

## 2. Client background

Poorna's Kitchen began as a cloud kitchen and has since opened for dine-in. It runs a physical loyalty card with five stamp slots. One visit earns one stamp; the fifth stamp earns a discount on that visit's bill.

---

## 3. Business problem

The card is the only record, and it lives in the customer's pocket. When it is forgotten, lost, damaged or left at home, the shop has no way to confirm where that customer stands, and the staff member has to either refuse the stamp or guess. The business also has no aggregate view of who its repeat customers are, how often they come, or how much discount it has given away.

The digital system does not replace the card. It runs alongside it as the shop's copy of the same five-stamp journey.

---

## 4. User problem

The staff member is mid-service when this happens. They are holding a bill, a customer is waiting, and there may be a queue. Anything that takes more than a few seconds, or that requires them to think about what to click next, will be abandoned and the record will go stale.

---

## 5. Product goal

A staff member can go from "what's your number?" to a recorded visit in under ten seconds, and can complete a reward — including the discount arithmetic — without a calculator and without a mistake.

---

## 6. Target users

**Primary — counter staff.** Serving customers while using this. Possibly a phone or a small tablet at the counter, possibly a laptop in the back. Not a trained software user. High interruption, low patience, real consequences for errors.

**Secondary — the owner.** Occasional use, on a laptop, to see how the programme is going and to correct records.

**Not a user — the customer.** They give a phone number and carry a card. There is no customer login, account, OTP, portal or digital card in this product, by design.

---

## 7. User roles

One role in the MVP: a signed-in staff member with full access. Everyone shares one console login.

**Business decision required:** whether each staff member should get their own account. It matters for two things — knowing who recorded a reward, and restricting deletion to the owner. Until someone decides, the prototype shows a single generic account.

---

## 8. Existing physical loyalty process

1. Customer visits.
2. Staff stamps slot 1 of a printed card and hands it over.
3. Each later visit fills the next slot.
4. On the fifth stamp, staff apply a percentage discount to that bill.
5. A fresh card starts.

Failure modes: forgotten card (no stamp given, or a stamp given on trust), lost card (progress gone), damaged card (disputed count), and no record at all on the shop's side.

---

## 9. Proposed digital process

The same five steps, with the console running in parallel:

1. Staff ask for the phone number and search it.
2. Found → the record shows the exact stamp count. Not found → create the customer, which records visit 1 in the same action.
3. Staff give the physical stamp and press **Add visit**.
4. On the fifth, the reward screen opens on its own — no one has to remember that a reward is due.
5. Staff enter the bill and the agreed percentage; the console does the arithmetic; confirming records the reward and resets the card to 0 of 5.

Lifetime visits never reset. Only the five-visit cycle does.

---

## 10. User journey

| Moment | Customer | Staff | Console |
|---|---|---|---|
| Arrival | Gives phone number | Types 10 digits, searches | Found / not found, in under a second |
| First visit | Receives card + stamp 1 | Name + phone, one button | Customer created, visit 1, 1 / 5 |
| Return visit | Hands over card | Stamps it, presses Add visit | Count increments, toast confirms |
| Fifth visit | Hands over full card | Enters bill + discount % | Reward screen opens by itself, computes payable |
| After reward | Starts a new card | Confirms | Cycle 0 / 5, lifetime untouched, reward logged |
| Forgot card | Gives number only | Searches | Progress is still there — the whole point |

---

## 11. User flows

**Find and record a visit**
`Find customer → enter phone → Search → found → Open customer → Add visit → toast → done`
On the fifth: `Add visit → reward screen → bill + % → Confirm → completion → back to customer`

**New customer**
`Add customer → name + phone → Create customer & add first visit → success, 1 / 5`
Duplicate phone → blocked inline with a **View customer** shortcut instead.

**Not found**
`Search → not found → Add new customer (phone already filled in) → create`

**Delete**
`Customers → trash icon → one confirmation → Cancel (nothing happens) or Delete customer (archived, list updates)`

---

## 12. Information architecture

```
Login
└── Staff Console
    ├── Counter          ← the three things used during service
    │   ├── Dashboard          today's numbers, recent visits, quick actions
    │   ├── Find customer      phone lookup
    │   └── Add customer       name + phone, creates visit 1
    ├── Records          ← lookups and history
    │   ├── Customers          table / cards, search, delete
    │   ├── Visit history      all visits, filterable
    │   └── Rewards            all completed rewards
    └── Admin
        ├── Reports            deliberately a placeholder
        └── Settings           placeholders only
```

The sidebar is grouped by *when* something is used, not by data type. "Counter" is what a staff member touches while a customer is standing there.

---

## 13. Business rules

| # | Rule |
|---|---|
| BR-1 | Cycle length is 5 visits, matching the printed card. |
| BR-2 | One visit increments lifetime visits by 1 and cycle visits by 1. |
| BR-3 | Reaching cycle 5 / 5 opens the reward flow automatically. |
| BR-4 | `discountAmount = billAmount × discountPercentage ÷ 100` |
| BR-5 | `finalAmount = billAmount − discountAmount`, never below zero. |
| BR-6 | Bill must be greater than 0. Discount must be between 0 and 100 inclusive. |
| BR-7 | Completing a reward resets cycle visits to 0 and increments rewards earned. |
| BR-8 | **Lifetime visits are never reset, ever.** |
| BR-9 | A phone number identifies one active customer. Duplicates are refused. |
| BR-10 | Phone numbers are Indian 10-digit mobiles starting 6–9. |
| BR-11 | Deletion asks for confirmation once, then archives (soft delete). |
| BR-12 | Only one modal may be open at a time. |

**Business decisions required — not invented here:**

1. **A cancelled reward.** The visit genuinely happened, so the prototype keeps the visit and leaves the card at 5 / 5 with a "Reward pending" badge and a **Complete reward** button. Nothing is recorded as a reward. The alternative — rolling the visit back — would falsify the visit count, so it was not chosen. Confirm this with the owner.
2. **Discount percentage.** There is no fixed value in the brief. The reward screen pre-fills 10% as a starting point and staff can type any valid number. If the shop has one standard rate, it should be locked in settings.
3. **Reporting.** No stated requirement, so no charts were invented. See §31.
4. **Staff accounts.** See §7.

---

## 14. Functional requirements

- FR-1 Staff sign-in (real authentication is out of scope for the prototype).
- FR-2 Search a customer by exact 10-digit phone number.
- FR-3 Create a customer (name, phone) and record their first visit in one action.
- FR-4 Reject a duplicate phone and offer the existing record.
- FR-5 Record a visit against a customer.
- FR-6 Display current cycle progress as filled stamp slots plus `n / 5`.
- FR-7 Trigger the reward flow when the cycle completes.
- FR-8 Accept a bill amount and a discount percentage; compute discount and payable live.
- FR-9 Validate both inputs and block confirmation while either is invalid.
- FR-10 On confirmation: record the reward, reset the cycle, increment rewards earned.
- FR-11 List customers with search and sort.
- FR-12 List all visits with text and date filters.
- FR-13 List all rewards with their amounts and status.
- FR-14 Delete a customer behind one confirmation.

---

## 15. Non-functional requirements

- Opens directly from the file system; no server, build step or dependency.
- A visit takes at most three interactions from the dashboard.
- Works from 375 px to 1440 px with no horizontal scrolling.
- Keyboard operable throughout; visible focus on every interactive element.
- Text contrast meets WCAG AA.
- Respects `prefers-reduced-motion`.
- No customer data leaves the device in the prototype (there is none — all data is in memory).

---

## 16. UX principles

1. **The phone number is the key.** Every path starts there.
2. **Never make staff calculate.** The console does the arithmetic and shows the payable figure larger than anything else on screen.
3. **Never make staff remember.** The fifth visit announces itself.
4. **One screen, one job.** Only one primary screen is visible; only one modal can ever open.
5. **Errors are caught before they cost money.** Confirm stays disabled while the bill or percentage is invalid.
6. **Quiet confirmations, loud decisions.** Ordinary visits get a toast; rewards and deletions get a focused dialog.

---

## 17. Design direction

Warm, restrained, and unmistakably a restaurant's tool rather than a generic admin panel. The warmth comes from the surface colours and one serif voice; the discipline comes from everything else staying plain. Cream canvas, white surfaces, a dark brown sidebar, maroon for anything that acts, gold reserved for "a reward is happening".

Boldness is spent in exactly two places: the row of stamp slots, and the final payable amount. Everything else is deliberately quiet.

---

## 18. Brand analysis

The logo is a circular medallion: a blush outer ring, a cream disc, a hand-drawn maroon wordmark curved over a gold line-drawn bowl, with "served with love" in gold script below and two maroon dots at the sides.

What it gives the interface:

- **Maroon** — the wordmark and dots. Serious, warm, not a generic alert red. Becomes the primary action colour.
- **Gold** — the script and bowl. Celebratory without being loud. Reserved for reward moments only.
- **Blush and cream** — the ring and disc. Become the tinted surfaces and the canvas.
- **Circular geometry** — echoed in the stamp slots and avatars, which is also what a rubber stamp looks like.
- **Handmade, not corporate** — a serif for headings, never a geometric sans.

The supplied file is a screenshot with a pink background and a stray mute badge in the corner. It was not redesigned: it was masked to the medallion's own circle and saved with transparency (`assets/poornas-kitchen-logo.png`). The untouched original is kept alongside as `poornas-kitchen-logo-original.png`. **Ask the client for the vector original before production.**

---

## 19. Colour system

All tokens are declared on `:root` in `styles.css`.

| Token | Hex | Use |
|---|---|---|
| `--primary` | `#7C1A1E` | Primary buttons, active nav, filled stamps, payable panel |
| `--primary-hover` | `#5E1216` | Hover state |
| `--primary-soft` | `#F8E4E1` | Avatar backgrounds, primary badges |
| `--primary-tint` | `#FCF1EF` | Row hover |
| `--secondary` | `#3A2D27` | Sidebar, toasts, body text at full weight |
| `--accent` | `#B9821C` | Reward moments only |
| `--accent-soft` | `#FBF0D9` | Reward panel, "close to a reward" |
| `--background` | `#FBF6EA` | Page canvas |
| `--surface` | `#FFFFFF` | Panels, inputs, modals |
| `--surface-muted` | `#F5EFE1` | Table headers, secondary button hover |
| `--text-primary` | `#2A201A` | Body text |
| `--text-secondary` | `#7A6A5C` | Labels, supporting text |
| `--border` | `#E8DCC7` | Separators |
| `--border-strong` | `#D6C6AC` | Input borders, empty stamp slots |
| `--success` | `#2F6B4F` | Completed badges, success notices |
| `--warning` | `#9A6A0E` | Pending reward, not-found notice |
| `--error` | `#AA2B22` | Validation, destructive action |

No bright generic red, no SaaS blue, no gradients used as decoration. The only gradient in the file is the short cream-to-white wash behind the reward crest.

Contrast: `--text-primary` on `--background` ≈ 13:1. `--text-secondary` on `--background` ≈ 4.8:1. White on `--primary` ≈ 9:1. All pass AA.

---

## 20. Typography

Two families, both already present on every machine, so the prototype needs no webfont request and works offline:

- **Georgia** (`--font-brand`) — page titles, customer names, metric values, the payable amount. Its wide, warm letterforms match the hand-lettered logo.
- **System sans** (`--font-ui`) — everything else, at 15 px base.

| Role | Size / weight |
|---|---|
| Page title | 30 px Georgia 400 (25 px on mobile) |
| Customer name | 30 px Georgia 400 |
| Modal title | 24 px Georgia 400 |
| Metric value | 34 px Georgia 400 |
| Final payable | 30 px Georgia 400, reversed on maroon |
| Section title | 15 px sans 600 |
| Body | 15 px / 1.55 |
| Supporting text | 14.5 px, `--text-secondary` |
| Label | 13.5 px sans 600 |
| Caption | 12.5–13 px, `--text-secondary` |
| Button | 14 px sans 600 (15 px for `.btn-lg`) |
| Input | 15 px, 48 px minimum height |

Sentence case throughout. No all-caps labels, no tracked-out eyebrows. Numeric columns use `font-variant-numeric: tabular-nums` so digits line up.

---

## 21. Spacing

Scale: **8, 12, 16, 24, 32, 40, 48** as `--s1` through `--s7`. Page padding is 32 px on desktop, 16 px on tablet, 12 px at 400 px and below. Content is capped at 1180 px; forms at 560 px.

Radius: 6 px (small controls), 10 px (buttons, inputs), 14 px (panels, modals), pill (badges). Shadows: one for panels, one for modals and toasts. Nothing else casts a shadow.

---

## 22. Components

Each is a documented class in `styles.css`.

| Component | Variants | States |
|---|---|---|
| Button | primary, quiet, ghost, danger, icon; sm / default / lg; block | default, hover, focus-visible, disabled |
| Input | text, tel, number, search, date, select; left affix (+91, ₹), right affix (%, show password) | default, focus, invalid, placeholder |
| Search field | with adjacent submit button | default, invalid, loading |
| Metric | default, accent | — |
| Loyalty progress | small (tables, 14 px dots), large (profile, 34 px slots with ticks) | empty (dashed outline), filled (maroon), complete (gold), newly filled (one-shot pop) |
| Table | 5–7 columns, `.col-optional` for trimming | hover, empty |
| Customer card (mobile) | — | default, hover |
| Panel | with / without header action | — |
| Row list | plain, clickable | hover, focus |
| Badge | success, warning, muted, primary | — |
| Notice | success, warning, error; optional actions | — |
| Toast | success, error, info | auto-dismiss at 3.2 s |
| Modal | standard, wide (reward) | one at a time only |
| Empty state | standalone, inside a panel (no border) | — |
| Loading | shimmer lines | respects reduced motion |
| Reward summary | calc rows + payable total | valid, invalid (total greys out) |

**Component rule:** cards are used where something is genuinely a separate object (a customer, a panel, a modal). Lists, tables, dividers and whitespace do the rest. No card inside a card inside a card.

---

## 23. Screen-by-screen specifications

### 01 · Login

- **Purpose** Get a staff member into the console.
- **Primary user** Counter staff, start of shift.
- **Entry point** Application root.
- **Layout** Two columns on desktop (form left, brand panel right); form only below 900 px.
- **Components** Logo, title, form, checkbox, link, primary button.
- **Primary CTA** Sign in. **Secondary** Forgot password (visual only).
- **Data** Username/email, password.
- **Interactions** Show/hide password toggles `type` and `aria-pressed`. Submit shows a brief "Signing in…" then the dashboard.
- **Validation** None in the prototype — any credentials pass.
- **States** Default, submitting. No error state until real authentication exists.
- **Responsive** Brand panel is hidden below 900 px; the form fills the width.
- **Accessibility** Labelled inputs, `autocomplete` hints, toggle has an accessible name.
- **Developer notes** Replace with the real auth call. The form does not post anywhere. Keep the "keep me signed in" behaviour honest — a shared counter device may want a short session instead.

### 02 · Dashboard

- **Purpose** Answer "what is happening today?" and nothing more.
- **Entry point** After sign-in; sidebar.
- **Layout** Four metrics, then a two-column split (recent visits ⅔, quick actions ⅓). One column below 1100 px.
- **Data** Visits today, active customers, rewards given with total discount, visits this month; six most recent visits; up to four customers at 4 / 5.
- **Interactions** A recent visit opens that customer. Quick actions navigate.
- **States** Default; empty recent-visits state before the first visit of the day.
- **Responsive** Metrics 4 → 2 columns; panels stack.
- **Developer notes** "Close to a reward" is derived, not stored. All five figures are single aggregate queries. Do not add widgets here without a stated need.

### 03 · Find customer

- **Purpose** The fastest path from a spoken phone number to a record.
- **Entry point** Sidebar, top bar (desktop and mobile), dashboard quick action.
- **Layout** Single 560 px column.
- **Primary CTA** Search.
- **Interactions** Input strips non-digits and caps at 10. Submitting shows a shimmer for ~400 ms, then a result. Demo chips fill and run a search.
- **Validation** Fails fast on anything that is not a 10-digit mobile: *"Enter a valid 10-digit mobile number."*
- **Found state** Name, phone, stamp row, lifetime/rewards/last visit, plus **Open customer** and **Add visit**.
- **Not found** Warning notice naming the number, with **Add new customer** (which carries the number across) and **Search again**.
- **Loading** Three shimmer lines.
- **Responsive** Search button goes full width below 720 px.
- **Accessibility** `aria-describedby` links input to its error; errors carry a dot as well as colour.
- **Developer notes** Exact-match lookup on an indexed phone column. Remove the demo chips before production.

### 04 · Customer profile

- **Purpose** Show where the customer stands and let staff act.
- **Entry point** Search result, customers list, visit/reward tables, dashboard.
- **Layout** Identity + primary action, a four-cell fact strip, the loyalty panel, then visit history and rewards.
- **Primary CTA** **Add visit** — or **Complete reward** when the card is already full.
- **Secondary** All visit history, Delete customer.
- **Data** Name, phone, customer since, lifetime visits, rewards earned, last visit, cycle progress, last 8 visits, all rewards.
- **Interactions** Add visit increments and animates the newly filled slot; the fifth opens the reward flow.
- **States** Default; reward pending (gold panel, badge, CTA swap); empty visit history; empty rewards; unavailable after deletion.
- **Responsive** Fact strip 4 → 2 cells; CTA full width below 720 px.
- **Developer notes** Long names wrap rather than truncate here — staff need to read the whole name. `Card n, stamp n` is derived from the visit number.

### 05 · Add customer

- **Purpose** Create a record and its first visit in one action.
- **Layout** 560 px form.
- **Primary CTA** Create customer & add first visit. **Secondary** Cancel.
- **Validation** Name at least 2 characters; phone must be a valid 10-digit mobile; duplicates refused inline with **View customer**.
- **Success** Green notice, the card showing 1 / 5, **Open customer**, **Add another customer**; the form is replaced, not left behind.
- **Developer notes** Create the customer and the visit in one transaction — a customer with zero visits should not be possible. The duplicate check must be a unique constraint, not just a UI check.

### 06 · Add visit

Not a screen — an action on the profile and the search result. Ordinary visits get a toast and an inline update, never a dialog. Repeated clicks are locked out for 700 ms and the button disables itself, so a double tap cannot record two visits.

### 07 · Fifth-visit reward

- **Purpose** Apply and record the discount correctly.
- **Form factor** A focused modal — one, never a page as well. Chosen over a dedicated page because it preserves the customer context behind it and cannot be navigated away from by accident.
- **Entry point** Automatically when a visit completes the card; or **Complete reward** on a pending profile.
- **Layout** Crest (five gold stamps, "Card complete", customer name, one line of explanation), then bill and discount side by side, then the calculation block.
- **Data in** Bill amount (₹ prefix), discount percentage (% suffix, pre-filled 10).
- **Data out** Bill, discount with its percentage, **final payable** reversed out of maroon at 30 px — the largest number on screen.
- **Interactions** Every keystroke recalculates. Confirm is disabled while anything is invalid, and the total greys out rather than showing a misleading number.
- **Validation** Bill blank / non-numeric / ≤ 0. Percentage blank / non-numeric / < 0 / > 100. Each message names the actual problem.
- **Success** The modal is replaced by a completion summary: bill, discount, lifetime visits marked *(unchanged)*, new card 0 / 5. Exits to the customer or to all rewards.
- **Cancel** Closes, records nothing, returns to the profile, which now shows "Reward pending".
- **Responsive** Bill and discount stack below 720 px; buttons stack with the primary on top.
- **Accessibility** `role="dialog"`, `aria-modal`, focus moves to the bill field, Tab is trapped, Escape closes, focus returns to the trigger.
- **Developer notes** Compute server-side as well and store all four numbers (bill, percentage, discount, final) — never recompute from a stored percentage later, because the rate may change. Round to 2 decimals. The confirm call must be idempotent.

### 08 · Customers

- **Purpose** Browse, find and manage records.
- **Layout** Header with CTA, a search + sort toolbar, then table (desktop) or stacked cards (≤ 900 px).
- **Columns** Customer, Phone, Lifetime visits, Current loyalty, Rewards, Last visit, action.
- **Interactions** Filter by name or phone as you type; sort by last visit, name, most visits, or closest to reward.
- **States** Default; no customers at all; no search matches; delete confirmation.
- **Responsive** Below 900 px each row becomes a card carrying name, phone, three facts, the stamp row, Open and delete. Between 900 and 1200 px the two lowest-priority columns are hidden so nothing scrolls sideways.
- **Developer notes** Paginate past ~200 customers; this prototype renders everything. Sorting is client-side here and should move server-side.

### 09 · Visit history

- **Purpose** Answer "did we record that visit?"
- **Columns** Customer, Phone, Visit number, Date, Time.
- **Interactions** Text filter and date filter, both clearable.
- **States** Default; no results for the filters; empty overall.
- **Responsive** Stacked cards below 900 px.
- **Developer notes** Capped at 60 rows in the prototype; use pagination and a date-range query in production.

### 10 · Rewards

- **Purpose** Show what the programme has cost and confirm a discount was recorded.
- **Layout** Three summary metrics, then the table.
- **Columns** Customer, Bill amount, Discount %, Discount amount, Final amount, Date, Status.
- **States** Default; empty.
- **Responsive** Stacked cards below 900 px, each ending with the final paid figure.
- **Developer notes** Status exists for a future "reversed" state. Treat rewards as append-only; corrections should be a new reversing row, not an edit.

### 11 · Delete confirmation

- **Purpose** Prevent an accidental, unrecoverable-looking action.
- **Layout** Destructive icon, question, plain-language consequence naming the customer and their visit count, Cancel and Delete customer.
- **Interactions** Cancel and Escape do nothing. Delete archives, closes, toasts, and updates whatever list is underneath.
- **Rule** This modal is opened through the same single-modal manager as every other dialog, so it can never appear over the reward modal or anything else.
- **Developer notes** Soft delete in production — set `status = 'archived'`, keep visits and rewards. The prototype already models it this way.

### 12–15 · Empty, error, success and loading states

Every list has an empty state that says what will fill it, and offers the action that would. Validation errors are inline, specific, and carry a non-colour marker. Success is a toast for routine actions and a dedicated panel for rewards and creation. Loading is a shimmer in the place the content will appear, never a blocking spinner.

**Network/error placeholder:** there is no network in the prototype. In production, a failed save must keep the staff member's input on screen and offer a retry — never clear the form.

---

## 24. Responsive strategy

Designed at **1440, 1280, 1024, 768, 430, 390, 375**.

| Width | Navigation | Tables | Layout |
|---|---|---|---|
| ≥ 1201 | Fixed 240 px sidebar | Full table | Two columns |
| 901–1200 | Fixed sidebar | Two lowest-priority columns hidden | Two columns to 1100 |
| ≤ 900 | Off-canvas drawer from the top bar | Stacked cards | Single column |
| ≤ 720 | Drawer; the top bar keeps Find customer and Add customer as icons | Stacked cards | Stacked; modal buttons stack |

**Why a drawer rather than bottom navigation.** There are eight destinations, which is more than a bottom bar holds honestly, and the counter's two most frequent actions — find and add — are promoted into the persistent top bar instead. That gives one-tap access to what is actually used mid-service while leaving the rest one tap away in the drawer. A bottom bar would have forced an arbitrary choice of five and buried the other three.

**Why cards instead of a scrolling table below 900 px.** A horizontally scrolling table hides the delete action and the loyalty column off-screen with no affordance. The card keeps every field and both actions visible.

The table breakpoint is deliberately tied to the navigation breakpoint: the table appears exactly when the sidebar is persistent. One rule, easy to remember, easy to keep.

Verified: no horizontal overflow at 375, 390, 768, 1024 or 1440.

---

## 25. Accessibility

- Every input has a `<label>`; errors are linked with `aria-describedby`.
- Errors carry a dot marker as well as red, so colour is never the only signal. Stamp slots differ by fill *and* outline style *and* a tick, and are always accompanied by the text `n / 5`.
- `:focus-visible` shows a 3 px maroon ring on everything interactive.
- Modals: `role="dialog"`, `aria-modal="true"`, labelled by their title, focus moved in, Tab trapped, Escape closes, focus restored on close.
- Toasts live in an `aria-live="polite"` region.
- Touch targets are at least 42 px (48 px for inputs and large buttons).
- A skip link precedes the sidebar.
- `prefers-reduced-motion` disables the stamp pop, modal rise and shimmer.
- Icons are decorative SVG; icon-only buttons carry `aria-label`.

**Still to do before production:** test with a screen reader, confirm the drawer's focus handling on iOS Safari, and add `aria-current="page"` to the active nav item.

---

## 26. Error, empty and loading states

| Trigger | Response |
|---|---|
| Blank name | *Enter the customer's name.* |
| Blank phone | *Phone number is required.* |
| Invalid phone | *Enter a valid 10-digit mobile number.* |
| Duplicate phone | *Customer already exists* — names the existing customer, offers **View customer**, creates nothing |
| Customer not found | Warning notice naming the number, offers **Add new customer** with it pre-filled |
| Blank / zero / negative bill | Field error; Confirm disabled; total greys out |
| Blank / negative / >100 discount | Field error naming the actual limit; Confirm disabled |
| Add visit on a full card | Error toast: complete the reward first |
| Reward cancelled | Info toast; card stays at 5 / 5 marked pending |
| Reward completed | Completion panel + toast |
| Delete cancelled | Nothing happens |
| Customer archived | Toast; removed from active lists |
| Empty customers / visits / rewards | Empty state explaining what fills it, with the action that would |
| No search matches | Distinct empty state — "check the spelling, or add a new customer" |
| Loading search | Shimmer in place |

---

## 27. Developer handoff

**Files**

```
poornas-kitchen-ui/
├── index.html      all screens; one #screen-* section each, hidden by default
├── styles.css      tokens (§1) → reset → components → responsive
├── script.js       20 numbered sections, IIFE, no globals
├── CASE-STUDY.md
├── README.md
└── assets/
    ├── poornas-kitchen-logo.png            masked, transparent
    └── poornas-kitchen-logo-original.png   as supplied
```

**Conventions**

- Design tokens are CSS custom properties on `:root`. Change the palette there, nowhere else.
- Screens are `<section class="screen" id="screen-{name}">`; the router in §7 of `script.js` hides all and shows one.
- Actions are declared in markup as data attributes (`data-goto`, `data-open-customer`, `data-add-visit`, `data-delete`, `data-reward-confirm`) and handled by one delegated listener. Adding a button needs no new listener.
- `openModal()` / `closeModal()` are the only way to show a dialog, and `openModal` closes any existing one first. This is what structurally guarantees modals never stack — keep it if you port the code.
- All interpolated strings pass through `esc()`.
- Icons are one inline `<symbol>` sprite; use `<svg class="ico"><use href="#i-name"></use></svg>`. No emoji.

**Porting to React**

Each `render*()` function maps to a component and each takes no arguments beyond module state, so they become props-driven components directly. `state` becomes a store or context. The delegated click handler becomes ordinary `onClick` props. The CSS needs no changes at all — it is plain classes and custom properties.

**What is faked and must be built**

Authentication; persistence (state is in memory and resets on reload); the 420 ms artificial search delay; server-side recomputation of the discount; pagination; and `TODAY` in `script.js` §1, which is pinned to 21 Sep 2026 so the demo reads consistently — replace with `new Date()`.

---

## 28. Data model assumptions

```
customer
  id            string, pk
  name          string, required
  phone         string(10), required, unique among active
  created_at    timestamp
  last_visit_at timestamp, nullable
  lifetime_visits  integer, default 0   -- never decremented
  cycle_visits     integer, default 0   -- 0..5, reset on reward
  rewards_earned   integer, default 0
  status        enum(active, archived)

visit
  id, customer_id fk, visited_at timestamp,
  visit_number integer,   -- the customer's nth visit, ever
  cycle_number integer    -- which five-visit card it belongs to

reward
  id, customer_id fk, visit_id fk nullable,
  bill_amount decimal(10,2), discount_percentage decimal(5,2),
  discount_amount decimal(10,2), final_amount decimal(10,2),
  awarded_at timestamp, status enum(completed, reversed)
```

Notes: store all four money values, not just the percentage. `cycle_visits` is denormalised for read speed — it must only ever be written by the add-visit and complete-reward operations, both of which should be transactional. Index `phone` and `visit.customer_id`.

---

## 29. Development roadmap

1. **Foundation** — schema, migrations, staff auth, app shell and navigation.
2. **Counter core** — search, create customer with first visit, add visit, loyalty state. This alone replaces the paper problem.
3. **Rewards** — the fifth-visit flow, server-side calculation, reward records.
4. **Records** — customers, visit history, rewards lists with filters and pagination.
5. **Care** — soft delete, staff accounts and permissions, an audit trail on rewards.
6. **Later** — anything in §31, only once asked for.

---

## 30. QA checklist

Run at 1440, 768 and 375.

- [ ] Sign in reaches the dashboard.
- [ ] Every sidebar item opens exactly one screen.
- [ ] Search a known number → found; unknown → not found with a create shortcut.
- [ ] Invalid phone (`123`, blank, letters) → clear message, no search.
- [ ] Create a customer → lifetime 1, cycle 1 / 5.
- [ ] Duplicate phone → refused, existing customer offered, nothing created.
- [ ] Add visit → lifetime +1, cycle +1, toast.
- [ ] Reaching 5 / 5 opens the reward flow by itself.
- [ ] ₹800 @ 10% → ₹80 / ₹720. ₹1000 @ 15% → ₹150 / ₹850.
- [ ] 0% → no discount. 100% → payable ₹0. Never negative.
- [ ] 101%, −5%, blank, `abc` → error, Confirm stays disabled.
- [ ] Bill 0, negative or blank → error, Confirm stays disabled.
- [ ] Cancel reward → nothing recorded, card stays 5 / 5 pending.
- [ ] Confirm reward → lifetime unchanged, cycle 0 / 5, rewards +1, row in Rewards.
- [ ] Next visit after a reward → lifetime +1, cycle 1 / 5.
- [ ] Delete → exactly one modal, nothing behind it; Cancel keeps the customer; Delete removes them.
- [ ] Rapid repeated taps on Add visit record one visit.
- [ ] Empty states appear for customers, visits, rewards and no-match searches.
- [ ] No horizontal scrolling; no clipped text; no target under 42 px.
- [ ] Tab reaches everything; focus is always visible; Escape closes modals.
- [ ] A very long name and a very large bill both render without breaking layout.

Every item above was executed against this prototype in Chromium before delivery — 50 automated checks, all passing.

---

## 31. Future enhancements

Explicitly **not** in this MVP:

- Monthly exports and repeat-rate reporting (once someone says what decision it informs).
- Individual staff accounts and role-based permissions.
- An audit trail showing who recorded or reversed a reward.
- WhatsApp or SMS reminders at 4 / 5.
- Offline-first behaviour for an unreliable counter connection.
- A read-only customer view — and note that this is *not* a customer account, portal or digital loyalty card, none of which this business needs.

None of these should reach the interface before the counter workflow above is in daily use and working.

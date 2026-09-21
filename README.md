# Poorna's Kitchen — Staff Console

A static UI prototype of the counter console for Poorna's Kitchen's five-visit loyalty programme. Staff find a customer by phone number, record a visit, and apply the discount when the card is complete. The printed stamp card is unchanged — this is the shop's own record of the same journey.

---

## How to open it

No installation. No terminal. No server.

1. Extract `poornas-kitchen-ui.zip`.
2. Open the `poornas-kitchen-ui` folder in VS Code.
3. Right-click `index.html` → **Copy Path**.
4. Paste the path into Chrome's address bar and press Enter.

It loads immediately. You can also just double-click `index.html`.

There is no `npm install`, no `npm run dev`, no localhost, no backend, no database, no API key and no environment variable. It runs from `file://`.

---

## Folder structure

```
poornas-kitchen-ui/
├── index.html      every screen
├── styles.css      design tokens and components
├── script.js       navigation, loyalty rules, discount calculation
├── CASE-STUDY.md   full design rationale and developer handoff
├── README.md       this file
└── assets/
    ├── poornas-kitchen-logo.png            cleaned, transparent background
    └── poornas-kitchen-logo-original.png   the file as supplied
```

---

## Trying it out

Sign in with anything — the credentials are pre-filled and not checked.

| To see | Do this |
|---|---|
| A returning customer | Find customer → `9876543210` |
| A customer about to earn a reward | Find customer → `9156784321` (at 4 / 5) → Add visit |
| The discount calculation | In the reward screen, enter a bill of `800` and `10`% → ₹80 off, ₹720 payable |
| Validation | Try a discount of `101`, or a bill of `0` |
| An unknown number | Find customer → `9000000000` |
| A duplicate | Add customer → `9876543210` |
| Delete confirmation | Customers → the trash icon on any row |
| Mobile layout | Resize to 375 px, or use Chrome's device toolbar |

All data is demonstration data held in memory. **Refreshing the page resets everything** — that is expected, since there is no database.

---

## What this is, and what it isn't

This is a **static UI prototype**: a complete, clickable picture of the product for review and for handing to a developer. The loyalty maths, validation and screen flow are all real and working in the browser.

Everything server-side still has to be built:

- Staff authentication
- A database, so records survive a refresh
- Server-side recalculation and storage of every reward
- Pagination for large customer and visit lists
- Soft delete, staff accounts and permissions

`CASE-STUDY.md` documents the data model, the business rules, every screen, and what is faked here.

One thing the developer should know up front: `TODAY` at the top of `script.js` is pinned to 21 Sep 2026 so the demo data reads consistently. Replace it with `new Date()`.

---

## Browser support

Built and verified in Chrome. Works in any current Chromium browser, Firefox or Safari. Fonts are system fonts, so nothing is downloaded and it looks the same offline.

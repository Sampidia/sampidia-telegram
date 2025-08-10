# Copilot Instructions for SamPidia Telegram App

## Overview
This codebase powers a Telegram Mini App for buying/selling Telegram Stars, with secure payments, purchase history, secret content delivery, and refunds via a Python companion bot. The frontend is built with Next.js 15, TypeScript, and Tailwind CSS; backend logic is split between Next.js API routes and a Python bot for refunds.

## Architecture & Data Flow
- **Frontend:** Located in `/app` (Next.js). UI components in `/app/components`. Main entry: `page.tsx`, layout: `layout.tsx`.
- **API Routes:** `/app/api/*` handles invoice creation, payment success, purchase history, refunds, and secret retrieval. These routes interact with Telegram Bot API and internal data.
- **Data:** Item definitions/configs in `/app/data/items.ts`. Secrets in `/app/server/item-secrets.ts`.
- **Types:** Shared TypeScript types/interfaces in `/app/types/index.ts`.
- **Static Assets:** In `/public`.
- **Python Bot:** Not included here; handles refunds via Telegram API. See README for setup.

## Key Workflows
- **Build:** `npm install` then `npm run build` (Node.js 18+ required).
- **Deploy:** Push to GitHub, connect to Vercel, set `BOT_TOKEN` in Vercel dashboard.
- **Telegram Integration:** App only works as a Telegram Mini App. Set up via BotFather using Vercel URL.
- **Environment Variables:** Store secrets (e.g., `BOT_TOKEN`) in `.env` (do not commit to GitHub).

## Project-Specific Patterns
- **API routes** use Next.js `route.ts` files, returning JSON responses for Telegram callbacks.
- **Purchase/Refund logic** is split: purchases via Next.js, refunds via Python bot.
- **Secrets** are delivered post-purchase via the app, not exposed in public code.
- **TypeScript** is used throughout for type safety.
- **Tailwind CSS** for styling; see `globals.css` for customizations.

## Conventions & Integration Points
- **Do not expose `.env` or secrets in public repos.**
- **All payments use Telegram Stars via Bot API.**
- **Refunds require the Python bot (see README for repo link/setup).**
- **Access control:** Secret codes only shown after successful purchase.
- **Testing:** No explicit test files found; validate via build and Telegram payment flows.

## Examples
- To add a new item for sale: update `/app/data/items.ts` and `/app/server/item-secrets.ts`.
- To add a new API route: create a new folder in `/app/api/` and add `route.ts`.
- To update UI: edit components in `/app/components/`.

## References
- See `README.md` for setup, deployment, and architecture details.
- See `/app/api/` for backend logic and integration with Telegram.
- See `/app/server/` for sensitive logic (not exposed to client).

---
For questions or unclear patterns, review the README or ask for clarification. Update this file as the codebase evolves.

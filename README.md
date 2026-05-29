# Instagram Blocker

Chrome extension that lets you block any Instagram account by username — including accounts that have blocked you first (making them unreachable through Instagram's own UI).

## Features

- **Block button injected on profile pages** — visit any profile, click Block
- **Popup UI** — block by username without visiting their page
- **Works when blocked** — if they blocked you, you can't reach their profile on mobile; this extension bypasses that

## How it works

Calls Instagram's internal GraphQL mutation (`usePolarisBlockManyMutation`) directly from your browser session, the same request Instagram's own UI fires. No external server. Your credentials never leave your browser.

## Install (unpacked)

1. Clone this repo
2. Go to `chrome://extensions` and enable **Developer Mode**
3. Click **Load unpacked** → select the repo folder
4. Open any Instagram profile — a red **Block** button appears bottom-right
5. Or use the extension popup to block by username

## Notes

- You must be logged into Instagram in the same browser
- `DOC_ID` in `content.js` is tied to Instagram's current deploy and may expire. If blocking stops working, capture a fresh `usePolarisBlockManyMutation` request from Instagram's Network tab and update the value
- Icons not included — add `icon16.png`, `icon48.png`, `icon128.png` to the `icons/` folder and register them in `manifest.json`

## Stack

Vanilla JS · Chrome Extension Manifest V3 · Instagram private GraphQL API

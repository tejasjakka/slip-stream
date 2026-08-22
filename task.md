# Task Tracker: Vercel Deployment

- `[/]` **Fix TypeScript Errors**
  - `[ ]` `src/App.tsx`: Remove `Users`, `HeartPulse`, `Code`, `setTimetable`, `index`.
  - `[ ]` `src/components/CanvasEngine.tsx`: Remove `React` import.
  - `[ ]` `src/components/MarkdownRenderer.tsx`: Remove `React` import.
  - `[ ]` `src/hooks/useLocalStorage.ts`: Remove `useEffect` import.
- `[ ]` **Vercel Serverless Config**
  - `[ ]` Update `server.js` to export the `app` instance.
  - `[ ]` Create `vercel.json` to route `/api/*` to `server.js`.
- `[ ]` **Verification & Deployment**
  - `[ ]` Run `npm run build` locally.
  - `[ ]` Commit and `git push`.

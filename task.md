# Task Tracker: Flawless AI Architecture

- `[/]` **Server Refactoring**
  - `[ ]` Instantiate `companionAI` using `GEMINI_API_KEY_COMPANION`.
  - `[ ]` Instantiate `notebookAI` using `GEMINI_API_KEY_SIMULATION`.
  - `[ ]` Instantiate `quizAI` using `GEMINI_API_KEY_SECONDARY`.
  - `[ ]` Instantiate `mentalHealthAI` using `GEMINI_API_KEY_MENTAL_HEALTH`.
  - `[ ]` Rewrite all routes (`/api/companion`, `/api/notebook`, `/api/quiz`, `/api/mental-health`) to use the Google SDK `generateContent` method.
  - `[ ]` Ensure all endpoints explicitly use model `gemini-3.6-flash`.
  - `[ ]` Restart Express server.
  
- `[ ]` **Verification**
  - `[ ]` Verify server starts without errors and all clients are mapped.

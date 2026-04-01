# PromptFlow Video — real prompt-to-video app

This is a real full-stack Next.js app wired for the Runway API.

## What it does

- Starts a real prompt-to-video task on the server
- Polls task status until the video is finished
- Shows the resulting output URL in a built-in video player
- Stores generation history in the browser

## Tech stack

- Next.js
- React
- Runway API (`@runwayml/sdk`)

## Before you run it

1. Create a Runway API organization and API key.
2. Add billing credits in the Runway developer portal.
3. Copy `.env.example` to `.env.local`.
4. Put your real key in `RUNWAYML_API_SECRET`.

## Local setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and add your key
npm run dev
```

Then open `http://localhost:3000`.

## Deploy

### Vercel

1. Create a new Vercel project from this folder.
2. Add the environment variable `RUNWAYML_API_SECRET` in the Vercel project settings.
3. Deploy.

### Other hosts

Use any host that supports a Node.js Next.js app and server-side environment variables.

## API routes

- `POST /api/generate` — starts a Runway video task
- `GET /api/tasks/:id` — returns the latest task state
- `GET /api/health` — checks whether the API key is configured

## Notes

- The current version is text-to-video.
- You can extend it later with image-to-video by adding file upload and `client.uploads.createEphemeral(...)`.
- Runway task output is asynchronous, so the UI polls every 5 seconds.

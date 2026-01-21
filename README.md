# Kboodle Uppy Companion

Uppy Companion server for handling Google Drive, Dropbox, and OneDrive imports.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

## Development

```bash
npm run dev  # Auto-restarts on file changes
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Update `COMPANION_HOST` to your domain
3. Update `COMPANION_PROTOCOL` to `https`
4. Update `UPLOAD_URLS` and `CORS_ORIGINS` for production domains
5. Use a process manager like PM2: `pm2 start server.js --name uppy-companion`

## Google OAuth Setup

The Google Client ID/Secret must have the Companion callback URL authorized:
- `https://your-companion-domain/drive/callback`

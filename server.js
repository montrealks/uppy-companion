require('dotenv').config();
const companion = require('@uppy/companion');

// Debug: log env vars on startup
console.log('Unsplash config:', {
  key: process.env.COMPANION_UNSPLASH_KEY ? 'SET' : 'MISSING',
  secret: process.env.COMPANION_UNSPLASH_SECRET ? 'SET' : 'MISSING',
});

const options = {
  providerOptions: {
    drive: {
      key: process.env.COMPANION_GOOGLE_KEY || process.env.GOOGLE_CLIENT_ID,
      secret: process.env.COMPANION_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    },
    dropbox: {
      key: process.env.COMPANION_DROPBOX_KEY || process.env.DROPBOX_KEY,
      secret: process.env.COMPANION_DROPBOX_SECRET || process.env.DROPBOX_SECRET,
    },
    onedrive: {
      key: process.env.COMPANION_ONEDRIVE_KEY || process.env.ONEDRIVE_KEY,
      secret: process.env.COMPANION_ONEDRIVE_SECRET || process.env.ONEDRIVE_SECRET,
    },
    unsplash: {
      key: process.env.COMPANION_UNSPLASH_KEY || process.env.UNSPLASH_KEY,
      secret: process.env.COMPANION_UNSPLASH_SECRET || process.env.UNSPLASH_SECRET,
    },
  },
  // Also add as searchProviders for backwards compatibility
  searchProviders: {
    unsplash: {
      key: process.env.COMPANION_UNSPLASH_KEY || process.env.UNSPLASH_KEY,
      secret: process.env.COMPANION_UNSPLASH_SECRET || process.env.UNSPLASH_SECRET,
    },
  },
  server: {
    host: process.env.COMPANION_HOST || 'localhost:3020',
    protocol: process.env.COMPANION_PROTOCOL || 'http',
    path: process.env.COMPANION_PATH || '',
  },
  filePath: process.env.FILE_PATH || '/tmp/uppy-companion',
  secret: process.env.COMPANION_SECRET,
  uploadUrls: (process.env.UPLOAD_URLS || '').split(',').filter(Boolean),
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
  debug: true, // Force debug for troubleshooting
  enableGooglePickerEndpoint: process.env.COMPANION_ENABLE_GOOGLE_PICKER_ENDPOINT === 'true',
};

const { app } = companion.app(options);

const port = process.env.PORT || 3020;

app.listen(port, () => {
  console.log(`Uppy Companion running on port ${port}`);
});

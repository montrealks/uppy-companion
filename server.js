require('dotenv').config();
const companionStandalone = require('@uppy/companion/lib/standalone');

const unsplashConfig = {
  key: process.env.COMPANION_UNSPLASH_KEY || process.env.UNSPLASH_KEY,
  secret: process.env.COMPANION_UNSPLASH_SECRET || process.env.UNSPLASH_SECRET,
};

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
    unsplash: unsplashConfig,
  },
  searchProviders: {
    unsplash: unsplashConfig,
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
  debug: process.env.NODE_ENV !== 'production',
};

// Use standalone which includes session middleware
const { app } = companionStandalone(options);

const port = process.env.PORT || 3020;

app.listen(port, () => {
  console.log(`Uppy Companion running on port ${port}`);
  console.log('Configured providers:');
  console.log('  - drive:', options.providerOptions.drive.key ? 'configured' : 'NOT CONFIGURED');
  console.log('  - unsplash:', options.providerOptions.unsplash.key ? 'configured' : 'NOT CONFIGURED');
});

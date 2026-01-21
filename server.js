require('dotenv').config();
const companion = require('@uppy/companion');

const options = {
  providerOptions: {
    drive: {
      key: process.env.GOOGLE_CLIENT_ID,
      secret: process.env.GOOGLE_CLIENT_SECRET,
    },
    dropbox: {
      key: process.env.DROPBOX_KEY,
      secret: process.env.DROPBOX_SECRET,
    },
    onedrive: {
      key: process.env.ONEDRIVE_KEY,
      secret: process.env.ONEDRIVE_SECRET,
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
  debug: process.env.NODE_ENV !== 'production',
};

const { app } = companion.app(options);

const port = process.env.PORT || 3020;

app.listen(port, () => {
  console.log(`Uppy Companion running on port ${port}`);
});

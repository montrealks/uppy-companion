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

// Google Photos Picker endpoint - downloads photo using access token
app.get('/google-picker/get', async (req, res) => {
  const { googlePhotosUrl, accessToken, fileName } = req.query;

  if (!googlePhotosUrl || !accessToken) {
    return res.status(400).json({ error: 'Missing googlePhotosUrl or accessToken' });
  }

  try {
    // Google Photos URLs need =d appended for full download
    const downloadUrl = googlePhotosUrl.includes('=')
      ? googlePhotosUrl + '-d'
      : googlePhotosUrl + '=d';

    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Google Photos fetch failed: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Failed to fetch from Google Photos' });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName || 'photo.jpg'}"`);

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Google Photos download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Google Photos thumbnail endpoint
app.get('/google-picker/thumbnail', async (req, res) => {
  const { googlePhotosUrl, accessToken } = req.query;

  if (!googlePhotosUrl || !accessToken) {
    return res.status(400).json({ error: 'Missing googlePhotosUrl or accessToken' });
  }

  try {
    // For thumbnails, use =w200-h200 for a small version
    const thumbnailUrl = googlePhotosUrl.includes('=')
      ? googlePhotosUrl + '-w200-h200'
      : googlePhotosUrl + '=w200-h200';

    const response = await fetch(thumbnailUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch thumbnail' });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Google Photos thumbnail error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fallback googlephotos endpoint
app.get('/googlephotos/get/*', async (req, res) => {
  const { accessToken, googlePhotosUrl } = req.query;

  if (!googlePhotosUrl || !accessToken) {
    return res.status(400).json({ error: 'Missing googlePhotosUrl or accessToken' });
  }

  try {
    const downloadUrl = googlePhotosUrl.includes('=')
      ? googlePhotosUrl + '-d'
      : googlePhotosUrl + '=d';

    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch from Google Photos' });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Google Photos fallback error:', error);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3020;

app.listen(port, () => {
  console.log(`Uppy Companion running on port ${port}`);
});

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const https = require('https');
const fs = require('fs');
const express = require('express');
const companion = require('@uppy/companion');
const session = require('express-session');
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;
const cors = require('cors');

// Create a custom agent to manage connection pooling, with a threshold of 30.
const customAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 30
});

const app = express();

// CORS configuration
const allowedOrigins = [
    'http://localhost',
    'https://dev.kboodle.com',
    'https://kboodle.local',
    'http://kboodle.local',
    'https://kbooble.com',
    'https://staging.kboodle.com',
    'https://staging2.kboodle.com'
];

app.use(cors({
    origin: function (origin, callback) {
        console.log(`[CORS] Request from origin: ${origin}`);
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            console.error(`[CORS] Blocked origin: ${origin}`);
            return callback(new Error(msg), false);
        }
        console.log(`[CORS] Allowed origin: ${origin}`);
        return callback(null, true);
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    preflightContinue: false,
    optionsSuccessStatus: 204
}));


// Initialize Redis Client and Store
let redisStore;
if (process.env.REDIS_URL) {
    const redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.connect().catch(console.error);
    redisStore = new RedisStore({ client: redisClient });
}


// Add session middleware
app.use(session({
    store: redisStore, // Use RedisStore in production
    secret: process.env.COMPANION_SECRET || 'a-very-secret-string-for-local-dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Add body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Pre-flight handlers are now handled by the cors middleware

// Google Picker thumbnail endpoint - serves small thumbnails for preview
app.get('/google-picker/thumbnail', async (req, res) => {
    try {
        const googlePhotosUrl = req.query.googlePhotosUrl;
        const accessToken = req.query.accessToken;

        if (!googlePhotosUrl || !accessToken) {
            return res.status(400).json({ error: 'Missing googlePhotosUrl or accessToken' });
        }

        let thumbnailUrl = googlePhotosUrl;
        if (googlePhotosUrl.includes('googleusercontent.com')) {
            thumbnailUrl = googlePhotosUrl.includes('=s') ?
                googlePhotosUrl.replace(/=s\d+/, '=s200') :
                `${googlePhotosUrl}=s200`;
        }

        const response = await fetch(thumbnailUrl, {
            agent: customAgent,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'Mozilla/5.0 (compatible; Uppy-Companion/1.0)'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to download thumbnail: ${response.status} ${response.statusText}`);
        }

        const thumbnailArrayBuffer = await response.arrayBuffer();
        const thumbnailBuffer = Buffer.from(thumbnailArrayBuffer);
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        res.set({
            'Content-Type': contentType,
            'Content-Length': thumbnailBuffer.length,
            'Cache-Control': 'public, max-age=3600'
        });

        res.send(thumbnailBuffer);

    } catch (error) {
        console.error('Thumbnail error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Google Picker endpoint (what the GooglePhotosPicker plugin expects)
app.get('/google-picker/get', async (req, res) => {
    try {
        const { fileId, fileName, googlePhotosUrl, accessToken, googleFileId } = req.query;

        if (googlePhotosUrl && accessToken) {
            try {
                let finalUrl = googlePhotosUrl;
                if (googlePhotosUrl.includes('googleusercontent.com') && !googlePhotosUrl.includes('=s')) {
                    finalUrl = `${googlePhotosUrl}=s2048`;
                }

                const response = await fetch(finalUrl, {
                    agent: customAgent,
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'User-Agent': 'Mozilla/5.0 (compatible; Uppy-Companion/1.0)'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to download from Google Photos: ${response.status} ${response.statusText}`);
                }

                const imageArrayBuffer = await response.arrayBuffer();
                const imageBuffer = Buffer.from(imageArrayBuffer);
                const contentType = response.headers.get('content-type') || 'image/jpeg';

                res.set({
                    'Content-Type': contentType,
                    'Content-Length': imageBuffer.length,
                    'Content-Disposition': `inline; filename="${fileName}"`
                });

                res.send(imageBuffer);

            } catch (error) {
                console.error('Error downloading from Google Photos:', error);
                throw error;
            }
        } else {
            const imageBuffer = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAHvuTiAAAAABJRU5ErkJggg==',
                'base64'
            );

            res.set({
                'Content-Type': 'image/png',
                'Content-Length': imageBuffer.length,
                'Content-Disposition': 'inline; filename="test-image.png"'
            });

            res.send(imageBuffer);
        }
    } catch (error) {
        console.error('Google Picker error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Unsplash download endpoint - handles downloading Unsplash images
app.get('/unsplash/get/:fileId', async (req, res) => {
    console.log(`[Unsplash Download] Received request for file: ${req.params.fileId} from origin: ${req.headers.origin}`);
    try {
        const fileId = req.params.fileId;
        const unsplashApiUrl = `https://api.unsplash.com/photos/${fileId}`;
        const response = await fetch(unsplashApiUrl, {
            agent: customAgent,
            headers: {
                'Authorization': `Client-ID ${companionOptions.providerOptions.unsplash.key}`,
                'User-Agent': 'Uppy-Companion/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get Unsplash image details: ${response.status} ${response.statusText}`);
        }

        const imageData = await response.json();

        if (imageData.links && imageData.links.download_location) {
            try {
                await fetch(imageData.links.download_location, {
                    agent: customAgent,
                    headers: {
                        'Authorization': `Client-ID ${companionOptions.providerOptions.unsplash.key}`,
                        'User-Agent': 'Uppy-Companion/1.0'
                    }
                });
            } catch (error) {
                console.warn('Failed to trigger download tracking:', error.message);
            }
        }

        const imageResponse = await fetch(imageData.urls.full, {
            agent: customAgent,
            headers: { 'User-Agent': 'Uppy-Companion/1.0' }
        });

        if (!imageResponse.ok) {
            throw new Error(`Failed to download Unsplash image: ${imageResponse.status} ${imageResponse.statusText}`);
        }

        const imageArrayBuffer = await imageResponse.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

        res.set({
            'Content-Type': contentType,
            'Content-Length': imageBuffer.length,
            'Content-Disposition': `inline; filename="${imageData.id}.jpg"`
        });

        res.send(imageBuffer);

    } catch (error) {
        console.error('Unsplash download error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Google Photos download endpoint
app.get('/googlephotos/get/:fileId(*)', async (req, res) => {
    console.log(`[Google Photos Download] Received request for file: ${req.params.fileId} from origin: ${req.headers.origin}`);
    try {
        const fileId = req.params.fileId;
        res.status(501).json({
            error: 'Google Photos download implementation in progress',
            fileId: fileId,
            message: 'Working on implementing the actual download from Google Photos API',
            sessionExists: !!req.session,
            hasGooglePhotosSession: !!(req.session && req.session.googlephotos)
        });
    } catch (error) {
        console.error('Google Photos download error:', error);
        res.status(500).json({ error: error.message });
    }
});

const companionOptions = {
    providerOptions: {
        drive: {
            key: process.env.GOOGLE_CLIENT_ID,
            secret: process.env.GOOGLE_CLIENT_SECRET,
            scope: ['https://www.googleapis.com/auth/photoslibrary.readonly']
        },
        unsplash: {
            key: process.env.UNSPLASH_ACCESS_KEY
        }
    },
    server: {
        host: process.env.COMPANION_HOST || '127.0.0.1:3020',
        protocol: process.env.COMPANION_PROTOCOL || 'https',
    },
    corsOrigins: allowedOrigins,
    filePath: process.env.NODE_ENV === 'production' ? '/tmp' : './data',
    secret: process.env.COMPANION_SECRET || 'a-very-secret-string-for-local-dev',
    debug: true,
    enableGooglePickerEndpoint: true,
    uploadUrls: [`${process.env.COMPANION_PROTOCOL || 'https'}://${process.env.COMPANION_HOST || '127.0.0.1:3020'}`],
    allowLocalUrls: true
};

const companionUrl = process.env.COMPANION_URL || `${companionOptions.server.protocol}://${companionOptions.server.host}`;

console.log('--- Companion Configuration ---');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Companion URL: ${companionUrl}`);
console.log(`File Path: ${companionOptions.filePath}`);
console.log('Verifying Redirect URIs for Google. Please ensure ONE of the following is in your Google Console "Authorized redirect URIs":');
console.log(`1. For modern providers (recommended): ${companionUrl}/drive/redirect`);
console.log(`2. For older providers: ${companionUrl}/googlephotos/redirect`);
console.log('Unsplash is configured with API key ending in:', (process.env.UNSPLASH_ACCESS_KEY || '...').slice(-6));
console.log('------------------------------------');
console.log('--- Full Companion Options ---', JSON.stringify(companionOptions, null, 2));


try {
    const { app: companionApp } = companion.app(companionOptions);
    app.use(companionApp);
} catch (error) {
    console.error('!!! FATAL: Companion failed to initialize !!!', error);
}


if (process.env.NODE_ENV !== 'production') {
    // Local development: Use HTTPS with mkcert certificates
    const sslOptions = {
        key: fs.readFileSync('./127.0.0.1+1-key.pem'),
        cert: fs.readFileSync('./127.0.0.1+1.pem')
    };

    const server = https.createServer(sslOptions, app).listen(3020, '127.0.0.1', () => {
        console.log(`Uppy Companion listening locally on https://127.0.0.1:3020`);
    });
    companion.socket(server, { app: companionApp });
} else {
    // Production: Export the app for Vercel
    module.exports = app;
}

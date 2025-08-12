# Server Deployment Guide

## Option 1: Railway (Recommended)

### Quick Deploy
1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Node.js and deploys!

### Environment Variables (Set in Railway Dashboard)
```
OPENAI_API_KEY=your_openai_api_key
MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=your_database_name
NODE_ENV=production
PORT=3000
```

### Railway Commands
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

## Option 2: Render

### Steps
1. Push to GitHub
2. Go to [render.com](https://render.com)
3. Connect GitHub repo
4. Choose "Web Service"
5. Set build command: `npm run build`
6. Set start command: `npm start`

### Environment Variables
Same as Railway above.

## Option 3: Vercel

### Steps
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts

### Vercel Configuration
Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/server.js"
    }
  ]
}
```

## Database Options

### MongoDB Atlas (Recommended)
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Add to environment variables

### Railway PostgreSQL
If you prefer PostgreSQL:
1. Add PostgreSQL service in Railway
2. Update your code to use PostgreSQL instead

## Build Commands
```bash
# Local build test
npm run build
npm start

# Docker build test
docker build -t voice-grocery-server .
docker run -p 3000:3000 voice-grocery-server
```

## CORS Configuration
Make sure your CORS allows your Cloudflare Pages domain:
```typescript
app.use(cors({
  origin: ['https://your-cloudflare-pages-domain.pages.dev', 'http://localhost:5173']
}));
```

## Health Check
Your server includes a `/health` endpoint that deployment platforms can use for health checks.

## Deployment Checklist
- [ ] Environment variables set
- [ ] MongoDB connection configured
- [ ] CORS configured for your frontend domain
- [ ] Build command working: `npm run build`
- [ ] Start command working: `npm start`
- [ ] Health check endpoint responding
- [ ] Database seeded (run seed script if needed)

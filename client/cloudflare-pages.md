# Cloudflare Pages Deployment Guide

## Build Settings for Cloudflare Pages

When setting up your project in Cloudflare Pages, use these settings:

### Build Configuration
- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `client` (if deploying from monorepo)

### Environment Variables
Add these in Cloudflare Pages dashboard:
```
VITE_API_URL=https://your-backend-api.com
```

### Required Changes Before Deployment

1. **Update vite.config.ts for production**:
   - Remove HTTPS cert configuration (Cloudflare handles SSL)
   - Remove proxy configuration (will use VITE_API_URL instead)

2. **Backend Deployment**:
   - Deploy your Node.js server to a service like Railway, Render, or Vercel
   - Update VITE_API_URL to point to your deployed backend

3. **CORS Configuration**:
   - Ensure your backend allows requests from your Cloudflare Pages domain

## Deployment Steps

1. Push code to GitHub
2. Connect repository to Cloudflare Pages
3. Configure build settings
4. Add environment variables
5. Deploy!

## Benefits of Cloudflare Pages
- Global CDN with 200+ edge locations
- Automatic SSL/TLS certificates
- Preview deployments for branches
- Built-in analytics
- Custom domains
- Edge-side includes and functions

# 🚀 HireTrack Deployment Guide

This guide covers deploying HireTrack with:

- **Frontend**: GitHub Pages (Free)
- **Backend**: Render.com (Free)
- **Database**: MongoDB Atlas (Free)
- **File Storage**: Cloudinary (Free)

---

## 📋 Prerequisites

Before deploying, ensure you have:

- GitHub account
- MongoDB Atlas account
- Render.com account
- Cloudinary account

---

## 1️⃣ Database Setup - MongoDB Atlas

### Step 1: Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (M0 Free tier)

### Step 2: Configure Database Access

1. In your Atlas dashboard, go to **Database Access**
2. Click **Add New Database User**
3. Create a user with username and password (save these!)
4. Set privileges to **Read and write to any database**

### Step 3: Configure Network Access

1. Go to **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (or add `0.0.0.0/0`)
   - For production, restrict to Render's IPs

### Step 4: Get Connection String

1. Go to **Database** → **Connect**
2. Choose **Connect your application**
3. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<username>` and `<password>` with your database user credentials
5. Add your database name: `...mongodb.net/hiretrack?retryWrites=true...`

---

## 2️⃣ File Storage Setup - Cloudinary

### Step 1: Create Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account

### Step 2: Get API Credentials

1. Go to your dashboard
2. Copy these values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

---

## 3️⃣ Backend Deployment - Render.com

### Step 1: Create Render Account

1. Go to [Render.com](https://render.com/)
2. Sign up and link your GitHub account

### Step 2: Deploy Backend

1. In Render dashboard, click **New +** → **Blueprint**
2. Connect your GitHub repository: `ashley-1318/hiretrack-ui`
3. Render will detect the `render.yaml` file automatically
4. Click **Apply**

> **⚠️ Important**: The `render.yaml` file does not contain sensitive values. You must manually configure all environment variables in Render's dashboard.

### Step 3: Configure Environment Variables

**CRITICAL**: You must manually add these environment variables in your Render service settings:

1. Go to your service in Render dashboard
2. Navigate to **Environment** tab
3. Add each of these variables with your actual values:

| Variable                | Value                                        | Description               |
| ----------------------- | -------------------------------------------- | ------------------------- |
| `NODE_ENV`              | `production`                                 | Environment mode          |
| `PORT`                  | `10000`                                      | Port (auto-set by Render) |
| `MONGO_URI`             | Your MongoDB connection string               | From Step 1.4             |
| `JWT_SECRET`            | Random string (e.g., `your-secret-key-here`) | For JWT tokens            |
| `GROQ_API_KEY`          | Your Groq API key                            | For AI features           |
| `CLOUDINARY_CLOUD_NAME` | Your cloud name                              | From Step 2.2             |
| `CLOUDINARY_API_KEY`    | Your API key                                 | From Step 2.2             |
| `CLOUDINARY_API_SECRET` | Your API secret                              | From Step 2.2             |

### Step 4: Get Backend URL

After deployment, your backend will be available at:

```
https://hiretrack-api.onrender.com
```

**Save this URL!** You'll need it for the frontend.

---

## 4️⃣ Frontend Deployment - GitHub Pages

### Step 1: Update Backend URL

1. Open `hiretrack-ui/.env.production`
2. Update `VITE_API_BASE_URL` with your Render URL:
   ```env
   VITE_API_BASE_URL=https://hiretrack-api.onrender.com
   ```

### Step 2: Enable GitHub Pages

1. Go to your GitHub repository settings
2. Navigate to **Pages** (left sidebar)
3. Under **Source**, select:
   - **Source**: GitHub Actions
4. Click **Save**

### Step 3: Deploy

The deployment will trigger automatically when you push to `main`:

```powershell
# Commit your changes
git add .
git commit -m "Configure deployment"
git push origin main
```

### Step 4: Access Your Site

After 2-3 minutes, your frontend will be live at:

```
https://ashley-1318.github.io/hiretrack-ui/
```

---

## 🔄 Updating Your Deployment

### Frontend Updates

Push to `main` branch - GitHub Actions will automatically rebuild and deploy:

```powershell
git add .
git commit -m "Your changes"
git push origin main
```

### Backend Updates

Push to `main` branch - Render will automatically rebuild and deploy:

```powershell
git add .
git commit -m "Backend updates"
git push origin main
```

---

## 🐛 Troubleshooting

### Frontend Issues

**404 errors on page refresh:**

- This is normal with client-side routing on GitHub Pages
- Consider adding a 404.html that redirects to index.html

**API calls failing:**

- Check CORS settings in backend
- Verify `VITE_API_BASE_URL` in `.env.production`
- Check browser console for errors

### Backend Issues

**Backend not responding:**

- Check Render logs: Dashboard → Your service → Logs
- Verify all environment variables are set
- Free tier sleeps after 15 min inactivity (first request takes longer)

**Database connection failed:**

- Verify MongoDB connection string format
- Check MongoDB Atlas network access (allow `0.0.0.0/0`)
- Ensure database user has correct permissions

**File uploads failing:**

- Verify all Cloudinary credentials are correct
- Check Cloudinary dashboard for quota limits

---

## 📊 Monitoring

### Render (Backend)

- View logs in Render dashboard
- Monitor deployment status
- Track resource usage

### MongoDB Atlas

- Monitor database metrics in Atlas dashboard
- Check connection logs
- View storage usage

### Cloudinary

- Check usage in Cloudinary dashboard
- Monitor storage and bandwidth

---

## 💰 Free Tier Limits

| Service           | Limit                                            |
| ----------------- | ------------------------------------------------ |
| **GitHub Pages**  | 100 GB bandwidth/month, 1 GB storage             |
| **Render**        | 750 hours/month, sleeps after 15 min inactivity  |
| **MongoDB Atlas** | 512 MB storage                                   |
| **Cloudinary**    | 25 credits/month (~25GB bandwidth, 25GB storage) |

---

## 🔐 Security Best Practices

1. **Never commit sensitive data**:

   - Keep `.env` files out of git
   - Use environment variables for secrets

2. **MongoDB Atlas**:

   - Restrict IP addresses in production
   - Use strong database passwords
   - Enable encryption at rest

3. **API Keys**:

   - Rotate keys regularly
   - Use different keys for dev/prod
   - Monitor API usage

4. **CORS**:
   - Configure proper CORS origins in backend
   - Don't use `*` in production

---

## 📝 Environment Variables Summary

### Backend (Render)

```env
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hiretrack
JWT_SECRET=your-super-secret-jwt-key
GROQ_API_KEY=gsk_your_groq_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env.production)

```env
VITE_API_BASE_URL=https://hiretrack-api.onrender.com
```

---

## 🎉 You're Done!

Your HireTrack application should now be fully deployed:

- **Frontend**: https://ashley-1318.github.io/hiretrack-ui/
- **Backend**: https://hiretrack-api.onrender.com
- **Database**: MongoDB Atlas
- **Storage**: Cloudinary

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs (Render, MongoDB Atlas)
3. Verify all environment variables are set correctly
4. Check GitHub Actions logs for frontend deployment issues

# Deploy E-Tax Backend & Database on Render

This guide will help you deploy your E-Tax backend and PostgreSQL database on Render.com.

## Prerequisites

- Render.com account (Free tier available)
- GitHub repository with your E-Tax code
- Git installed locally

## Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Ensure your repository is public** or grant Render access to private repos.

## Step 2: Deploy PostgreSQL Database

1. **Go to Render Dashboard** → **New** → **PostgreSQL**

2. **Configure Database**:
   - **Name**: `etax-db`
   - **Database Name**: `etax`
   - **User**: `postgres`
   - **Region**: Choose nearest to your users
   - **Plan**: Free tier is fine for development

3. **Click "Create PostgreSQL"**

4. **Wait for deployment** (2-3 minutes)

5. **Get Connection Details**:
   - Go to your database dashboard
   - Copy the **Internal Connection String**
   - Note: It will look like `postgres://postgres:password@hostname:5432/etax`

## Step 3: Deploy Backend API

### Option A: Using Render Dashboard (Recommended)

1. **Go to Render Dashboard** → **New** → **Web Service**

2. **Connect Repository**:
   - Connect your GitHub repository
   - Select the `E-Tax` repository
   - Choose the `main` branch

3. **Configure Service**:
   - **Name**: `etax-api`
   - **Environment**: `Go`
   - **Root Directory**: `backend`
   - **Build Command**: `go mod download && go build -o bin/main .`
   - **Start Command**: `./bin/main`

4. **Environment Variables**:
   ```
   PORT=10000
   APP_ENV=production
   DATABASE_URL=your_database_connection_string
   JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long
   ALLOWED_ORIGINS=https://your-frontend-domain.onrender.com
   RATE_LIMIT_REQUESTS=100
   RATE_LIMIT_WINDOW=20
   DB_MAX_OPEN_CONNS=25
   DB_MAX_IDLE_CONNS=10
   DB_CONN_MAX_LIFETIME=300
   ```

5. **Advanced Settings**:
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: Yes (for automatic updates)

6. **Click "Create Web Service"**

### Option B: Using render.yaml (Infrastructure as Code)

1. **Update render.yaml** with your GitHub repository:
   ```yaml
   repo: https://github.com/YOUR_USERNAME/E-Tax
   ```

2. **Go to Render Dashboard** → **New** → **Blueprint**

3. **Connect your repository** and select `render.yaml`

4. **Click "Apply Blueprint"**

## Step 4: Configure Environment Variables

After deployment, you may need to update environment variables:

1. **Go to your backend service** → **Environment**

2. **Add/Update Variables**:
   - `DATABASE_URL`: Get from your PostgreSQL service
   - `JWT_SECRET`: Generate a secure 32+ character string
   - `ALLOWED_ORIGINS`: Add your frontend domain

3. **Restart the service** after updating variables

## Step 5: Verify Deployment

1. **Check Health Endpoint**:
   ```bash
   curl https://your-api-name.onrender.com/health
   ```

2. **Check API Root**:
   ```bash
   curl https://your-api-name.onrender.com/
   ```

3. **View Logs**: Go to your service → **Logs** tab

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (Render uses 10000) | Yes |
| `APP_ENV` | Environment (development/production) | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret (32+ chars) | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | Yes |
| `RATE_LIMIT_REQUESTS` | Rate limit requests per window | No |
| `RATE_LIMIT_WINDOW` | Rate limit window in seconds | No |
| `DB_MAX_OPEN_CONNS` | Database max open connections | No |
| `DB_MAX_IDLE_CONNS` | Database max idle connections | No |
| `DB_CONN_MAX_LIFETIME` | DB connection lifetime (seconds) | No |

## Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check Go version compatibility (requires Go 1.23+)
   - Verify `go.mod` and `go.sum` are committed
   - Check build logs for specific errors

2. **Database Connection Failed**:
   - Verify `DATABASE_URL` is correct
   - Check if database is running
   - Ensure SSL mode is correct (Render requires SSL)

3. **CORS Issues**:
   - Update `ALLOWED_ORIGINS` with your frontend domain
   - Include both HTTP and HTTPS if needed

4. **Health Check Failing**:
   - Ensure `/health` endpoint exists
   - Check if service is starting properly
   - Review startup logs

### Getting Help

- **Render Documentation**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Community**: https://community.render.com

## Next Steps

1. **Deploy Frontend**: Deploy your React frontend to Render
2. **Custom Domain**: Set up custom domains for production
3. **Monitoring**: Set up alerts and monitoring
4. **Backup**: Configure database backups

## Cost Optimization

- **Free Tier**: Render offers generous free tiers
- **Database**: Free PostgreSQL includes 90GB storage
- **Backend**: Free web service with 750 hours/month
- **Scaling**: Upgrade as your user base grows

---

**🎉 Your E-Tax backend is now deployed on Render!**

# NovaCommerce Production Deployment & Hosting Guide

This guide provides end-to-end instructions for deploying NovaCommerce to public cloud hosting platforms.

---

## 🚀 Recommended Deployment Strategies

| Strategy | Frontend | Backend | Best For | Cost |
| :--- | :--- | :--- | :--- | :---: |
| **Strategy 1: Full-Stack Vercel (1-Click)** | **Vercel Static CDN** | **Vercel Serverless Function (`api/index.js`)** | 1 single project, 1 domain, zero CORS, zero server management | **100% Free Tier** |
| **Strategy 2: Decoupled Cloud** | **Vercel** / **Netlify** | **Render** / **Railway** (All-in-One Runner `start-all.js`) | Always-on background tasks, dedicated containers | **Free / Cheap** |
| **Strategy 3: Docker Container (VPS)** | **Nginx Container** | **Docker Container (`Dockerfile.production`)** | Single VPS (DigitalOcean Droplet, Linode, AWS EC2) | $5 - $12/mo |
| **Strategy 4: Enterprise Kubernetes** | **K8s Ingress + Pods** | **K8s Microservices Cluster (`k8s/`)** | Large multi-pod production scale | Production |

---

## 🛠️ Step 0: Cloud Services Setup (Prerequisites)

Before deploying, obtain the following managed cloud credentials:

1. **MongoDB Atlas** (Free M0 Sandbox):
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas).
   - Create a free database cluster.
   - Under **Database Access**, create a database user and password.
   - Under **Network Access**, add IP `0.0.0.0/0` (allow access from anywhere).
   - Copy your connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/ecommerce?retryWrites=true&w=majority`.

2. **Upstash Redis** (Free Serverless Redis):
   - Go to [upstash.com](https://upstash.com).
   - Create a Redis database (choose region closest to your deployment).
   - Copy the `rediss://...` connection URL.

3. **Cloudinary** (Media & Product Image Storage):
   - Go to [cloudinary.com](https://cloudinary.com).
   - Copy your `Cloud Name`, `API Key`, and `API Secret`.

---

## ⚡ Strategy 1: Full-Stack Vercel Deployment (Frontend + Express API)

Because NovaCommerce now includes a native Vercel Serverless Function entrypoint ([`api/index.js`](file:///e:/E-Commerce/api/index.js)) and root [`vercel.json`](file:///e:/E-Commerce/vercel.json), you can host **both the React 19 Frontend AND the complete Express API** inside a **single Vercel project**!

### Advantages:
* **Same-Domain Architecture**: Both frontend and backend share `https://your-app.vercel.app`.
* **Zero CORS Configuration**: Requests go to `/api/*` directly on the same origin.
* **100% Cookie Reliability**: Session cookies are strictly same-origin (`lax`), preventing browser third-party cookie blocking.
* **1-Click Free Hosting**: No need to manage or pay for separate backend instances.

### Step-by-Step Instructions:

1. **Push your code to GitHub**.
2. Go to [vercel.com](https://vercel.com) and click **Add New...** $\rightarrow$ **Project**.
3. Import your GitHub repository.
4. In **Project Settings**:
   - **Root Directory**: Leave as `./` (the repository root).
   - **Framework Preset**: `Vite` (or `Other`).
   - The root [`vercel.json`](file:///e:/E-Commerce/vercel.json) will automatically manage the client build and serverless routes.
5. In **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/ecommerce?retryWrites=true&w=majority`
   - `REDIS_URL`: `rediss://default:<password>@<endpoint>.upstash.io:6379`
   - `JWT_SECRET`: `your-random-64-character-secret`
   - `COOKIE_SAME_SITE`: `lax`
   - `CLOUDINARY_CLOUD_NAME`: `your_name`
   - `CLOUDINARY_API_KEY`: `your_key`
   - `CLOUDINARY_API_SECRET`: `your_secret`
   - `KAFKA_ENABLED`: `false`
6. Click **Deploy**.
7. Once finished:
   - Your storefront is live at `https://your-project.vercel.app`.
   - Your Express API is live at `https://your-project.vercel.app/api`.
   - Your Swagger documentation is live at `https://your-project.vercel.app/api/docs`.

---

## 🌐 Strategy 2: Vercel (Frontend) + Render / Railway (Backend)

If you prefer keeping the backend running as an always-on long-running process (e.g. for persistent Kafka streaming or background schedulers):

### 1. Backend Deployment (Render or Railway)
1. In Render ([render.com](https://render.com)), click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository.
3. Configuration:
   - **Build Command**: `npm install --prefix gateway && npm install --prefix services`
   - **Start Command**: `node start-all.js`
4. Environment Variables:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://...`
   - `REDIS_URL`: `rediss://...`
   - `JWT_SECRET`: `your-random-64-character-secret`
   - `COOKIE_SAME_SITE`: `none`
   - `COOKIE_SECURE`: `true`
   - `ALLOW_PREVIEW_ORIGINS`: `true`
   - `CLIENT_URL`: `https://your-store.vercel.app`
5. Note your backend URL (e.g. `https://novacommerce-api.onrender.com`).

### 2. Frontend Deployment (Vercel)
1. Import repository on Vercel.
2. Set **Root Directory** to `client`.
3. Set Environment Variable:
   - `VITE_API_URL`: `https://novacommerce-api.onrender.com/api`
4. Deploy!

---

## 🐳 Strategy 3: Containerized Deployment via Docker

### Backend Container (`Dockerfile.production`)
```bash
# Build unified backend production container
docker build -t novacommerce-backend -f Dockerfile.production .

# Run container
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGO_URI="mongodb+srv://..." \
  -e REDIS_URL="rediss://..." \
  -e JWT_SECRET="your-secret" \
  --name novacommerce-api \
  novacommerce-backend
```

### Frontend Container (`client/Dockerfile`)
```bash
# Build frontend container with production API URL
docker build \
  --build-arg VITE_API_URL="https://api.yourdomain.com/api" \
  -t novacommerce-client \
  ./client

# Run frontend container
docker run -d -p 80:80 --name novacommerce-ui novacommerce-client
```

---

## ☸️ Strategy 4: Kubernetes Deployment (`k8s/`)

For enterprise cloud clusters (AWS EKS, GKE, DigitalOcean K8s):

```bash
# 1. Create namespace
kubectl apply -f k8s/00-namespace.yaml

# 2. Apply ConfigMaps and Secrets
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secrets.yaml

# 3. Apply Nginx Ingress & HPA autoscaling
kubectl apply -f k8s/03-ingress.yaml
kubectl apply -f k8s/04-hpa.yaml

# 4. Deploy microservices and frontend
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/

# 5. Verify pods
kubectl get pods -n novacommerce
```

---

## 🔍 Verification Checklist After Deployment

1. **API Status Probe**:
   ```bash
   curl -I https://your-project.vercel.app/api/health
   # Expected: HTTP/2 200 OK
   ```

2. **OpenAPI Swagger Documentation**:
   - Open: `https://your-project.vercel.app/api/docs`
   - Test querying `GET /api/products`.

3. **Frontend Storefront**:
   - Open: `https://your-project.vercel.app`
   - Test customer registration, login, wishlist toggle, AI shopping assistant drawer, and multi-step cart checkout.

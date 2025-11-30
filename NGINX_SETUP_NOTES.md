# Nginx Setup - Important Notes

## Architecture Overview

### Server Configuration
- **Domain**: `hr-orbit.ai-liaise.com`
- **VM IP**: `34.80.84.47`
- **Load Balancer IP**: `34.54.101.102`
- **HTTP Port**: 80 (handles both direct traffic and load balancer traffic)
- **HTTPS Port**: 443 (for direct server access; SSL termination at load balancer)

### Upstream Servers

#### Backend (FastAPI)
- **Upstream Name**: `backend_servers`
- **Port**: 8000
- **Address**: `127.0.0.1:8000`
- **Load Balancing**: Least connections algorithm
- **Keep-alive**: 32 connections, 60s timeout
- **Health Check**: `/health` endpoint (CRITICAL for GCP Load Balancer)

#### Frontend (Next.js)
- **Upstream Name**: `frontend_servers`
- **Port**: 3000
- **Address**: `127.0.0.1:3000`
- **Load Balancing**: Least connections algorithm
- **Keep-alive**: 32 connections, 60s timeout

---

## Routing Rules (Order Matters!)

### 1. Health Check Endpoint
```
Location: /health
Purpose: GCP Load Balancer health checks
Response: 200 "healthy\n"
```
**⚠️ CRITICAL**: Health check path must be `/health` in GCP Load Balancer configuration, NOT `/`

### 2. Next.js API Routes (Cookie Management)
```
Location: ~ ^/api/auth/(me|set-cookies|clear-cookies|get-token)
Proxy: frontend_servers (port 3000)
```
These routes are handled by Next.js, not the backend.

### 3. FastAPI Documentation Routes
```
Location: ~ ^/(docs|redoc|openapi.json)$
Proxy: backend_servers (port 8000)
```
Direct access to FastAPI Swagger/ReDoc documentation.

### 4. Backend API Routes
```
Location: /api/
Action: Strip /api prefix, then proxy to backend
Example: /api/auth/login → /auth/login (backend)
Proxy: backend_servers (port 8000)
```

**Important Routes**:
- `/api/auth/*` → `/auth/*`
- `/api/candidates/*` → `/candidates/*`
- `/api/reports/*` → `/reports/*`
- `/api/dashboard/*` → `/dashboard/*`
- `/api/attendance/*` → `/attendance/*`
- `/api/recruitment/*` → `/recruitment/*`
- `/api/team-members/*` → `/team-members/*`
- `/api/users/*` → `/users/*`

### 5. Next.js Static Files
```
Location: /_next/
Proxy: frontend_servers (port 3000)
Cache: 60 minutes, immutable
```
Must be before catch-all location to avoid conflicts.

### 6. Frontend Catch-All
```
Location: /
Proxy: frontend_servers (port 3000)
```
**Must be last** to catch all other requests.

---

## SSL/TLS Configuration

### SSL Termination
- **Primary**: Google Cloud Load Balancer handles SSL termination
- **Nginx receives**: HTTP traffic from load balancer
- **Direct access**: Self-signed certificate for direct server access

### SSL Certificates
- **Path**: `/etc/ssl/certs/hr-orbit-selfsigned.crt`
- **Key**: `/etc/ssl/private/hr-orbit-selfsigned.key`
- **Protocols**: TLSv1.2, TLSv1.3
- **For Production**: Consider Let's Encrypt certificates

---

## CORS Configuration

### Backend API CORS Headers
```
Access-Control-Allow-Origin: https://hr-orbit.ai-liaise.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Authorization, Content-Type, Accept
Access-Control-Allow-Credentials: true
```

### Preflight Requests (OPTIONS)
- Automatically handled with 204 response
- Max-Age: 1728000 seconds (20 days)

---

## Security Headers

### HTTP Headers (Port 80)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### HTTPS Headers (Port 443)
- All above headers, plus:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## Proxy Headers

### Critical Headers Passed to Backend/Frontend
```
X-Real-IP: $remote_addr
X-Forwarded-For: $proxy_add_x_forwarded_for
X-Forwarded-Proto: https (or $scheme)
X-Forwarded-Host: $host
Host: $host
```

**Important**: `X-Forwarded-Proto` is set to `https` because SSL termination happens at the load balancer.

---

## Timeouts

### Proxy Timeouts
- **Connect**: 60s
- **Send**: 60s
- **Read**: 60s

These are important for long-running requests.

---

## Compression

### Gzip Configuration
- **Enabled**: Yes
- **Min Length**: 1024 bytes
- **Types**: text/plain, text/css, text/xml, text/javascript, application/javascript, application/xml+rss, application/json

---

## HTTP to HTTPS Redirect

### Direct Browser Access
- If `X-Forwarded-For` header is missing (direct browser access), redirect HTTP to HTTPS
- Load balancer traffic includes `X-Forwarded-For`, so no redirect occurs

---

## Important Notes

### 1. Location Order is Critical
The order of `location` blocks matters in nginx:
1. Most specific patterns first (`/api/auth/...`)
2. Specific paths (`/api/`, `/_next/`)
3. Catch-all last (`/`)

### 2. Health Check Endpoint
- **MUST** be `/health` (not `/`)
- Used by GCP Load Balancer for backend health checks
- Returns simple 200 response

### 3. API Prefix Stripping
- `/api/*` routes have the `/api` prefix stripped before forwarding to backend
- Example: `/api/auth/login` → backend receives `/auth/login`

### 4. Next.js Static Files
- `/_next/` contains Next.js static assets
- Cached for 60 minutes with immutable cache headers
- Must be proxied, not served directly

### 5. Load Balancer Integration
- SSL termination at GCP Load Balancer
- Nginx receives HTTP traffic
- Must set `X-Forwarded-Proto: https` for proper protocol detection

### 6. Keep-Alive Connections
- Backend: 32 keep-alive connections, 60s timeout
- Frontend: 32 keep-alive connections, 60s timeout
- Improves performance by reusing connections

### 7. Error Pages
- 404: `/404.html`
- 500/502/503/504: `/50x.html`
- Ensure these files exist in `/var/www/html/` or adjust paths

---

## Testing Commands

```bash
# Test health endpoint
curl http://localhost/health

# Test backend API
curl -H "Authorization: Bearer <token>" http://localhost/api/auth/me

# Test frontend
curl http://localhost/

# Test with domain (via load balancer)
curl -k https://hr-orbit.ai-liaise.com/health
```

---

## Common Issues

### Issue: Backend shows unhealthy in GCP
**Solution**: Verify health check path is `/health` in GCP Load Balancer configuration

### Issue: CORS errors
**Solution**: Check that `Access-Control-Allow-Origin` matches your frontend domain

### Issue: 404 on API routes
**Solution**: Verify `/api/` location block is before catch-all `/` location

### Issue: Static files not loading
**Solution**: Ensure `/_next/` location is before catch-all and frontend is running on port 3000

### Issue: SSL errors
**Solution**: For production, use Let's Encrypt certificates or Google-managed certificates

---

## File Locations

- **Nginx Config**: `/etc/nginx/sites-available/nextjs.conf`
- **Symlink**: `/etc/nginx/sites-enabled/nextjs.conf` (should link to sites-available)
- **SSL Cert**: `/etc/ssl/certs/hr-orbit-selfsigned.crt`
- **SSL Key**: `/etc/ssl/private/hr-orbit-selfsigned.key`
- **Error Pages**: `/var/www/html/404.html`, `/var/www/html/50x.html`

---

## Reloading Nginx

After making changes:
```bash
# Test configuration
sudo nginx -t

# Reload nginx (graceful, no downtime)
sudo systemctl reload nginx

# Or restart (brief downtime)
sudo systemctl restart nginx
```


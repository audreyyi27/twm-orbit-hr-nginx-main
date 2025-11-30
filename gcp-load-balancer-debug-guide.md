# GCP Load Balancer Debugging Guide

## Overview
- Domain: `hr-orbit.ai-liaise.com` → `34.54.101.102` (Load Balancer)
- VM IP: `34.80.84.47`
- Backend Service: `orbit-hr-be`
- Instance Group: `orbit-automatic-recruitment-group`

---

## Step 1: Check Load Balancer Frontend Configuration

### Path:
`Network Services` → `Load Balancing` → Click your Load Balancer name

### What to Check:

#### A. Frontend Configuration
1. **Click "Frontend configuration" tab** (or section)
2. Look for **HTTPS frontend** (not HTTP)
3. Verify:
   - ✅ **Protocol**: HTTPS
   - ✅ **Port**: 443
   - ✅ **IP address**: `34.54.101.102`
   - ✅ **SSL certificate**: Must be attached and valid

#### B. If HTTPS Frontend is Missing:
1. Click **"Edit"** on the Load Balancer
2. Click **"Add frontend IP and port"** (or similar)
3. Configure:
   - **Name**: `frontend-https`
   - **Protocol**: HTTPS
   - **IP version**: IPv4
   - **IP address**: Select `34.54.101.102`
   - **Port**: 443
   - **Certificate**: Select or create SSL certificate for `hr-orbit.ai-liaise.com`
4. Click **"Done"** or **"Create"**

#### C. If SSL Certificate is Missing:
1. Go to: `Network Services` → `Load Balancing` → `SSL certificates`
2. Click **"Create SSL Certificate"**
3. Choose:
   - **Google-managed certificate** (recommended)
     - Domain names: `hr-orbit.ai-liaise.com`
   - OR **Upload your own certificate**
4. Create and attach to the Load Balancer frontend

---

## Step 2: Check URL Map / Routing Rules

### Path:
`Network Services` → `Load Balancing` → Your Load Balancer → `URL Map` tab

### What to Check:

#### A. Default Backend Service
1. Look for **"Default backend service"** or **"Default service"**
2. Must be set to: `orbit-hr-be`
3. If wrong:
   - Click **"Edit"**
   - Change default backend to `orbit-hr-be`
   - Click **"Save"**

#### B. Host Rules (if configured)
1. Check **"Host rules"** section
2. If rules exist:
   - Verify one rule matches `hr-orbit.ai-liaise.com`
   - That rule should point to `orbit-hr-be` backend

#### C. Path Rules (if configured)
1. Check **"Path rules"** section
2. Usually not needed for simple setup (can be empty)

---

## Step 3: Check Backend Service Configuration

### Path:
`Network Services` → `Load Balancing` → `Backend services` → `orbit-hr-be`

### What to Check:

#### A. General Settings
- ✅ **Protocol**: HTTP (not HTTPS)
- ✅ **Named port**: `port8000`
- ✅ **Timeout**: 30 seconds (or reasonable value)

#### B. Backends Section
1. Click **"Backends"** tab
2. Should show: `orbit-automatic-recruitment-group`
3. **Healthy**: Must show `1 of 1` (or more if multiple VMs)
4. If shows `0 of 1`:
   - Health checks are failing
   - Go to Step 4 to check health check

#### C. Health Check
- Should be: `http-port-8000`
- Click the health check name to verify configuration (see Step 4)

---

## Step 4: Check Health Check Configuration

### Path:
`Network Services` → `Load Balancing` → `Health checks` → `http-port-8000`

### What to Check:

#### A. Protocol and Port
- ✅ **Protocol**: HTTP
- ✅ **Port**: 8000

#### B. Request Path (CRITICAL!)
- ✅ **Request path**: `/health` (NOT `/`)
- ⚠️ If it shows `/` or is empty:
  1. Click **"Edit"**
  2. Find **"Request path"** or **"Path"** field
  3. Change to: `/health`
  4. Click **"Save"**
  5. Wait 2-5 minutes for propagation

#### C. Health Criteria
- **Check interval**: 5 seconds (OK)
- **Timeout**: 5 seconds (OK)
- **Healthy threshold**: 2 consecutive successes (OK)
- **Unhealthy threshold**: 2 consecutive failures (OK)

#### D. Verify Backend is Healthy
1. Go back to: Backend Service → `orbit-hr-be` → Backends tab
2. Wait 2-5 minutes after changing health check path
3. Check if status changes to `1 of 1 Healthy`

---

## Step 5: Check Instance Group Configuration

### Path:
`Compute Engine` → `Instance groups` → `orbit-automatic-recruitment-group`

### What to Check:

#### A. Port Mapping
1. Click **"Edit"** (if needed)
2. Go to **"Port mapping"** section
3. Verify:
   - ✅ `port8000` → `8000` exists
   - ✅ If `port443` exists, it's optional (not needed for HTTP backend)

#### B. VM Instances
- Should show 1 instance (your VM)
- Status should be **"Running"**

---

## Step 6: Check Firewall Rules

### Path:
`VPC Network` → `Firewall` → Rules

### What to Check:

#### A. Allow Health Checks
Look for a rule that allows:
- **Source**: GCP Load Balancer ranges
  - `130.211.0.0/22`
  - `35.191.0.0/16`
- **Destination**: Your VM (`34.80.84.47` or `10.140.0.45`)
- **Port**: 8000
- **Protocol**: TCP

If missing, create:
1. Click **"Create Firewall Rule"**
2. Configure:
   - **Name**: `allow-lb-health-checks`
   - **Direction**: Ingress
   - **Source**: IP ranges → `130.211.0.0/22` and `35.191.0.0/16`
   - **Destination**: Targets → Select your VM or network
   - **Ports**: TCP → `8000`
3. Click **"Create"**

#### B. Allow HTTPS Traffic (for Load Balancer)
Look for a rule allowing:
- **Source**: `0.0.0.0/0` (internet)
- **Destination**: Load Balancer IP or any
- **Port**: 443
- **Protocol**: TCP

If missing, create:
1. Click **"Create Firewall Rule"**
2. Configure:
   - **Name**: `allow-https`
   - **Direction**: Ingress
   - **Source**: IP ranges → `0.0.0.0/0`
   - **Destination**: Targets → All instances or specific
   - **Ports**: TCP → `443`
3. Click **"Create"**

---

## Step 7: Verify Complete Flow

### Check List:
- [ ] HTTPS Frontend exists on port 443
- [ ] SSL certificate is attached to frontend
- [ ] URL Map default backend = `orbit-hr-be`
- [ ] Backend service protocol = HTTP
- [ ] Backend service named port = `port8000`
- [ ] Backend shows `1 of 1 Healthy`
- [ ] Health check path = `/health`
- [ ] Instance group has `port8000` mapping
- [ ] Firewall allows health check IPs on port 8000
- [ ] Firewall allows HTTPS (443) traffic

---

## Step 8: Test After Changes

After making changes:

1. **Wait 2-5 minutes** for propagation
2. **Test the domain**:
   ```bash
   curl -k https://hr-orbit.ai-liaise.com/health
   ```
3. **Check Backend Health**:
   - Go to: Backend Service → Backends tab
   - Should show: `1 of 1 Healthy`
4. **If still not working**:
   - Check GCP Console → Operations → Logs
   - Look for errors related to load balancer
   - Verify all steps above

---

## Common Issues and Fixes

### Issue 1: SSL Handshake Fails
**Cause**: HTTPS frontend not configured or SSL certificate missing  
**Fix**: Create HTTPS frontend with SSL certificate (Step 1)

### Issue 2: Backend Shows Unhealthy
**Cause**: Health check path wrong or firewall blocking  
**Fix**: Set health check path to `/health` (Step 4) and check firewall (Step 6)

### Issue 3: 404 or Wrong Service
**Cause**: URL Map not pointing to correct backend  
**Fix**: Update URL Map default backend to `orbit-hr-be` (Step 2)

### Issue 4: Connection Timeout
**Cause**: Firewall blocking traffic  
**Fix**: Create firewall rules (Step 6)

---

## Quick Test Commands

```bash
# Test direct VM access (should work)
curl -k https://34.80.84.47/health

# Test domain via load balancer (should work after fixing)
curl -k https://hr-orbit.ai-liaise.com/health

# Test domain status code
curl -k -s -o /dev/null -w "Status: %{http_code}\n" https://hr-orbit.ai-liaise.com/health
```

---

## Expected Result

After completing all steps:
- ✅ Domain `https://hr-orbit.ai-liaise.com` should be accessible
- ✅ Backend service shows `1 of 1 Healthy`
- ✅ SSL certificate is valid and working
- ✅ Traffic flows: Domain → Load Balancer → VM → Nginx → Backend/Frontend






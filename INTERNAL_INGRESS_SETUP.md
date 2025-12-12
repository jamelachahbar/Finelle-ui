# Internal Backend Ingress Configuration Guide

This document explains how the frontend is configured to work with **both external and internal backend ingress** in Azure Container Apps.

## 🎯 Problem Statement

When you set your backend Container App ingress to **internal**:
- The backend FQDN changes to `...internal...azurecontainerapps.io`
- This internal endpoint is **only reachable from within the Container Apps environment**
- Browsers cannot directly call internal endpoints (they're not on the internet)
- CORS errors appear even though the real issue is network unreachability

## ✅ Solution: Reverse Proxy Pattern

Instead of the browser calling the backend directly, the frontend **nginx server acts as a reverse proxy**:

```
Browser Request:
https://frontend.region.azurecontainerapps.io/api/ask

     ↓ (same-origin request, no CORS)

Frontend nginx proxies to:
http://backend-app/ask

     ↓ (internal Container Apps networking)

Backend with internal ingress
(only accessible within environment)
```

### Benefits
- ✅ Backend can use **internal ingress** (more secure, not publicly accessible)
- ✅ Frontend uses **external ingress** (publicly accessible)
- ✅ No CORS issues (browser only talks to frontend origin)
- ✅ Internal traffic never leaves the Container Apps environment
- ✅ Works for both HTTP requests and Server-Sent Events (SSE) streaming

## 📝 What Changed

### 1. nginx.conf - Added Reverse Proxy
```nginx
location /api/ {
    proxy_buffering off;  # Required for SSE streaming
    proxy_cache off;
    
    set $backend_url "${BACKEND_URL}";
    rewrite ^/api/(.*)$ /$1 break;
    proxy_pass $backend_url;
    
    # Proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # SSE support
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding off;
}
```

### 2. Frontend Code - Uses Relative URLs
All API calls now use `/api/` prefix instead of full backend URLs:

**Before:**
```typescript
const BASE_URL = env.BACKEND_URL; // https://backend.region.azurecontainerapps.io
const url = `${BASE_URL}/ask`;
```

**After:**
```typescript
const BASE_URL = '/api'; // Relative URL, proxied by nginx
const url = `${BASE_URL}/ask`; // Browser calls: /api/ask
```

Files updated:
- `src/api/harisApi.ts`
- `src/hooks/useAgentChat.ts`
- `src/components/ChatWindow.tsx`

## 🔧 Configuration Steps

### Option 1: Backend with Internal Ingress (Recommended)

This is the most secure option. The backend is not publicly accessible.

#### 1. Set Backend App Name in Environment
The nginx configuration needs to know the backend app name. You have two options:

**Option A: Use Container Apps service discovery (simplest)**

Set the `BACKEND_URL` environment variable to the backend app name:

```bash
# In your backend Container App configuration
# No need to change anything - backend stays as-is

# In your frontend Container App configuration, set:
BACKEND_URL=http://backend-app-name
```

Replace `backend-app-name` with your actual backend Container App name.

**Option B: Use backend app FQDN**

Even with internal ingress, you can use the FQDN (though the app name is simpler):

```bash
BACKEND_URL=http://backend-app.internal.environment-id.region.azurecontainerapps.io
```

#### 2. Set Backend Ingress to Internal

In your backend Container App:
- **Ingress**: Enabled
- **Exposure**: Internal
- **Target Port**: (your backend port, e.g., 8000)

#### 3. Deploy Frontend with Updated Configuration

```bash
# Set the backend URL in azd environment
azd env set backendUrl "http://your-backend-app-name"

# Or for internal FQDN approach:
# azd env set backendUrl "http://backend.internal.unique-id.region.azurecontainerapps.io"

# Deploy
azd deploy
```

### Option 2: Backend with External Ingress (Testing/Development)

If you want to keep the backend publicly accessible (e.g., for testing, direct API access):

#### 1. Keep Backend External
- **Ingress**: Enabled
- **Exposure**: External
- **Target Port**: (your backend port)

#### 2. Update Frontend Environment Variable

```bash
# Use the full external FQDN
azd env set backendUrl "https://backend-app.region.azurecontainerapps.io"

azd deploy
```

**Note**: Even with external backend, the reverse proxy pattern still works and eliminates CORS issues.

## 🔍 How to Find Your Backend App Name

```bash
# List all container apps in your environment
az containerapp list --environment <YOUR_ENVIRONMENT_NAME> --query "[].{Name:name, FQDN:properties.configuration.ingress.fqdn}" -o table
```

Or in Azure Portal:
1. Navigate to your Container Apps Environment
2. Click "Apps" in the left menu
3. The "Name" column shows the app name (use this for `http://<APP_NAME>`)
4. The FQDN is shown in the app details

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│ Azure Container Apps Environment                    │
│                                                      │
│  ┌────────────────────┐      ┌──────────────────┐  │
│  │  Frontend App      │      │  Backend App     │  │
│  │  (External Ingress)│      │ (Internal Ingress)│  │
│  │                    │      │                  │  │
│  │  ┌──────────────┐  │      │  ┌────────────┐ │  │
│  │  │    nginx     │──┼──────┼─▶│   API      │ │  │
│  │  │ Reverse Proxy│  │      │  │  Server    │ │  │
│  │  └──────────────┘  │      │  └────────────┘ │  │
│  │         ▲          │      │                  │  │
│  └─────────┼──────────┘      └──────────────────┘  │
│            │                                         │
└────────────┼─────────────────────────────────────────┘
             │
             │ HTTPS (Public Internet)
             │
        ┌────┴────┐
        │ Browser │
        └─────────┘
```

## 🧪 Testing

### 1. Check Frontend Logs
```bash
az containerapp logs show --name <frontend-app-name> --resource-group <rg-name> --follow
```

Look for:
```
🔗 API environment debug: {...}
🔍 Chat environment debug: {...}
Strategy: nginx reverse proxy to internal backend
```

### 2. Check Backend Logs
```bash
az containerapp logs show --name <backend-app-name> --resource-group <rg-name> --follow
```

Backend should show incoming requests from the frontend nginx proxy.

### 3. Test in Browser
1. Open your frontend: `https://frontend-app.region.azurecontainerapps.io`
2. Open browser DevTools (F12) → Network tab
3. Send a chat message
4. Verify requests go to `/api/ask-stream` (not a full backend URL)
5. Verify SSE streaming works (watch the EventStream responses)

### 4. Verify Backend is Internal
Try accessing the backend directly in browser:
```
http://backend-app.internal.xxx.region.azurecontainerapps.io/health
```

This should **fail** (timeout or not resolve) because it's not publicly accessible.

## 🐛 Troubleshooting

### Issue: nginx returns 502 Bad Gateway

**Cause**: nginx can't reach the backend

**Solutions**:
1. Check `BACKEND_URL` environment variable is set correctly in frontend Container App
2. Verify both apps are in the **same Container Apps environment**
3. Check backend app name spelling
4. Verify backend ingress is enabled (internal or external)

### Issue: EventSource/SSE streaming doesn't work

**Cause**: Proxy buffering is enabled

**Solution**: Verify nginx.conf has:
```nginx
proxy_buffering off;
proxy_cache off;
```

### Issue: CORS errors still appear

**Cause**: Frontend code still using full backend URLs instead of relative URLs

**Solution**: Check that all API calls use `/api/` prefix:
```typescript
// ✅ Correct
const url = '/api/ask';
const eventSource = new EventSource('/api/ask-stream');

// ❌ Wrong (bypasses nginx proxy)
const url = 'https://backend.azurecontainerapps.io/ask';
```

## 📚 Official Documentation

- [Communicate between container apps](https://learn.microsoft.com/en-us/azure/container-apps/connect-apps)
- [Ingress in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/ingress-overview)
- [Configure ingress](https://learn.microsoft.com/en-us/azure/container-apps/ingress-how-to)
- [Networking in Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/networking)

## 🔐 Security Benefits

Using internal ingress for the backend provides:

1. **Reduced Attack Surface**: Backend is not exposed to the internet
2. **Defense in Depth**: Only the frontend (which serves static files + proxy) is public
3. **Network Isolation**: Backend traffic stays within the Container Apps environment
4. **No Public IP for Backend**: Backend doesn't consume a public IP address

## 💡 Key Takeaways

1. **Always use relative URLs** (`/api/`) in frontend code
2. **nginx reverse proxy** handles routing to backend
3. **Backend can be internal** (more secure) or external (more flexible)
4. **No CORS configuration needed** when using the reverse proxy pattern
5. **SSE/EventSource streaming works** with `proxy_buffering off`
6. **Container Apps service discovery** allows using `http://<APP_NAME>` for internal communication

---

**Need Help?** Check the [Azure Container Apps documentation](https://learn.microsoft.com/en-us/azure/container-apps/) or open an issue in the repository.

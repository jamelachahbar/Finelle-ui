# 🚀 Quick Start Commands - Finelle UI Deployment

## Prerequisites ✅
You already have:
- Azure CLI authenticated ✅  
- Azure Developer CLI installed ✅
- Docker Desktop installed and running ⚠️
- VS Code open in Finelle-ui directory

## 1️⃣ First Time Deployment

**IMPORTANT: Start Docker Desktop first!**

Open VS Code terminal (`Ctrl+` backtick) and run:

```powershell
# 1. Start Docker/Rancher Desktop (if not running)
# For Docker Desktop:
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
# For Rancher Desktop:
Start-Process "C:\Program Files\Rancher Desktop\Rancher Desktop.exe"

# Wait 2-3 minutes for Docker daemon to fully initialize
# Test with: docker version

# 2. Authenticate with your tenant
azd auth login --tenant-id dc06fa00-1806-48fc-864d-c47c49f0138c

# 3. Initialize project
azd init

# 4. Deploy everything
azd up
```

**Follow prompts:**
- Environment name: `finelle-dev`
- Subscription: [Select yours]
- Location: `East US 2`

## 2️⃣ Using VS Code Tasks (Easier!)

Press `Ctrl+Shift+P` then type:
```
Tasks: Run Task
```
Select: `Azure: Deploy to Container Apps`

## 3️⃣ Code-Only Updates (Fast!)

```powershell
# Set environment variable for tenant
$env:AZURE_TENANT_ID = "dc06fa00-1806-48fc-864d-c47c49f0138c"

# Deploy code changes only
azd deploy
```

Or use VS Code task:
```
Ctrl+Shift+P → Tasks: Run Task → Azure: Deploy Application Only
```

## 5️⃣ Post-Deployment Setup (One-time)

After first deployment, grant Container App access to pull from ACR:
```powershell
# Get the Container App's managed identity principal ID
$principalId = az containerapp show --name ca-finelle-ui-dev-xxxxx --resource-group rg-finelle-ui-dev --query "identity.principalId" -o tsv

# Get the ACR resource ID  
$acrId = az acr show --name acrfinelleuidevxxxxx --resource-group rg-finelle-ui-dev --query "id" -o tsv

# Grant AcrPull permission
az role assignment create --assignee $principalId --role AcrPull --scope $acrId
```

## 6️⃣ View Your App

After deployment, look for this in terminal output:
```
You can view the application here:
https://ca-finelle-ui-dev-xxxxx.eastus2.azurecontainerapps.io
```

## 7️⃣ Check Logs

```powershell
azd monitor --logs
```

## 🔄 Daily Workflow

1. **Make changes** in VS Code
2. **Test locally**: `npm run dev`
3. **Deploy**: `Ctrl+Shift+P` → `Tasks: Run Task` → `Azure: Deploy Application Only`
4. **Check app**: Visit your URL

## 🆘 Troubleshooting

**Docker not running:**
```powershell
# If using Docker Desktop:
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# If using Rancher Desktop:
Start-Process "C:\Program Files\Rancher Desktop\Rancher Desktop.exe"

# If Docker daemon won't start, try restarting:
taskkill /F /IM "Rancher Desktop.exe"
Start-Sleep 5
Start-Process "C:\Program Files\Rancher Desktop\Rancher Desktop.exe"

# Wait 2-3 minutes, then check:
docker version
```

**Alternative: Deploy without Docker (if Docker issues persist):**
```powershell
# Build locally first
npm run build

# Use Azure CLI to create resources manually
az group create --name rg-finelle-dev --location eastus2
# Then deploy built files to Azure Static Web Apps or App Service
```

**Authentication issues:**
```powershell
azd auth login
```

**Build errors:**
```powershell
# If npm install fails during Docker build:
npm cache clean --force
npm install

# Then rebuild:
npm run build
```

**Docker build integrity errors:**
```powershell
# Clear Docker build cache
docker builder prune -f

# Retry deployment
azd up
```

**Bicep deployment location errors:**
The infrastructure template has been updated to use resource group scope instead of subscription scope for better compatibility.

**TypeScript build errors (tsc not found):**
The Dockerfile has been updated to include dev dependencies needed for building.
If you still see "tsc: not found" errors, verify your package.json includes TypeScript:
```powershell
npm list typescript
```

**View detailed logs:**
```powershell
azd show
```

## 📱 Quick Commands Reference

| What you want to do | Command |
|---------------------|---------|
| First deploy | `azd up` |
| Update code | `azd deploy` |
| View logs | `azd monitor --logs` |
| Check status | `azd show` |
| Build locally | `npm run build` |

---
**🎯 Start with Step 1 above if this is your first deployment!**

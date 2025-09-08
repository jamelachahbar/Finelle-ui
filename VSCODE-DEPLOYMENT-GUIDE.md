# 🚀 VS Code Deployment Guide - Finelle UI to Azure Container Apps

This guide provides step-by-step instructions to deploy your Finelle UI React application to Azure Container Apps directly from VS Code.

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] VS Code installed
- [ ] Azure CLI installed (you already have this ✅)
- [ ] Azure Developer CLI installed (you already have this ✅)
- [ ] Docker Desktop installed and running
- [ ] Node.js 18+ installed
- [ ] Active Azure subscription

## 🔧 Step 1: Install Required VS Code Extensions

Open VS Code Extensions panel (`Ctrl+Shift+X`) and install these extensions:

```
1. Azure Developer CLI (Microsoft)
2. Azure Account (Microsoft)
3. Azure Resources (Microsoft)
4. Azure Container Apps (Microsoft)
5. Bicep (Microsoft)
6. Docker (Microsoft)
```

**To install via Command Palette:**
1. Press `Ctrl+Shift+P`
2. Type: `Extensions: Install Extensions`
3. Search for each extension and install

## 🎯 Step 2: Initial Setup and Authentication

### 2.1 Open Project in VS Code
```bash
# Open VS Code in the Finelle-ui directory
code c:\_repos\Finelle-ui
```

### 2.2 Authenticate with Azure
Press `Ctrl+Shift+P` and run these commands one by one:

**Option A: Using Command Palette**
1. `Azure: Sign In` - Sign in to your Azure account
2. `Azure Developer CLI: auth login` - Authenticate AZD

**Option B: Using VS Code Terminal**
1. Open terminal: `Ctrl+` ` `
2. Run commands:
```powershell
# Authenticate Azure CLI (you've already done this ✅)
az login --tenant 72f988bf-86f1-41af-91ab-2d7cd011db47

# Authenticate Azure Developer CLI (you've already done this ✅)
azd auth login

# Verify authentication
az account show
azd auth list
```

## 🏗️ Step 3: Pre-Deployment Setup

### 3.1 Verify Project Structure
In VS Code Explorer, confirm you have these files:
```
Finelle-ui/
├── infrastructure/
│   ├── main.bicep
│   └── environments/
│       ├── main.parameters.json
│       └── main.parameters.prod.json
├── .github/workflows/deploy.yml
├── azure.yaml
├── Dockerfile
├── nginx.conf
├── .dockerignore
├── package.json
└── .vscode/
    ├── tasks.json
    └── launch.json
```

### 3.2 Build Application Locally (Optional Test)
Open VS Code terminal (`Ctrl+` ` `) and run:
```powershell
# Install dependencies
npm install

# Build the application
npm run build

# Verify dist folder is created
ls dist
```

## 🚀 Step 4: Deploy Using VS Code Tasks (Recommended)

### Method A: Using Command Palette
1. Press `Ctrl+Shift+P`
2. Type: `Tasks: Run Task`
3. Select: `Azure: Deploy to Container Apps`
4. Follow the prompts in the terminal

### Method B: Using Keyboard Shortcut
1. Press `Ctrl+Shift+P`
2. Type: `Tasks: Run Build Task`
3. Select: `Azure: Deploy to Container Apps`

### Method C: Using VS Code Menu
1. Go to `Terminal` → `Run Task...`
2. Select: `Azure: Deploy to Container Apps`

## 📝 Step 5: Complete Deployment Process

When you run the deployment task, you'll see prompts in the VS Code terminal. Here's what to expect:

### 5.1 First-Time Deployment
```powershell
# The azd up command will ask you several questions:
```

**Question 1: Environment Name**
```
Enter a new environment name: finelle-dev
```

**Question 2: Azure Subscription**
```
Select an Azure Subscription to use:
> [Your Subscription Name]
```

**Question 3: Azure Location**
```
Select an Azure location to use:
> East US 2
```

### 5.2 Monitor Deployment Progress
The terminal will show progress for each step:
```
✓ Provisioning Azure resources (azd provision)
✓ Building application
✓ Creating Docker image
✓ Pushing to Azure Container Registry
✓ Deploying to Container Apps
```

### 5.3 Deployment Success
When complete, you'll see:
```
SUCCESS: Your application was provisioned and deployed to Azure in X minutes.

You can view the resources created under the resource group rg-finelle-ui-dev in the Azure portal:
https://portal.azure.com/#@/resource/subscriptions/.../resourceGroups/rg-finelle-ui-dev

You can view the application here:
https://ca-finelle-ui-dev-xxxxx.eastus2.azurecontainerapps.io
```

## 🎛️ Step 6: Alternative Deployment Methods

### Option 1: Azure Developer CLI Commands
Open VS Code terminal and run:
```powershell
# Full deployment (first time)
azd up

# Deploy code changes only (faster)
azd deploy

# Provision infrastructure only
azd provision

# View deployment status
azd show

# View logs
azd monitor --logs
```

### Option 2: Individual VS Code Tasks
Use these tasks for specific operations:

1. **Infrastructure Only**: `Azure: Provision Infrastructure Only`
2. **Application Only**: `Azure: Deploy Application Only`
3. **Build React App**: `Build: React Application`
4. **Build Docker**: `Docker: Build Image`
5. **View Logs**: `Azure: View Logs`

## 🔍 Step 7: Verify Deployment

### 7.1 Check Azure Resources
1. Press `Ctrl+Shift+P`
2. Type: `Azure: Focus on Resources View`
3. Expand your subscription to see created resources:
   - Resource Group: `rg-finelle-ui-dev`
   - Container App: `ca-finelle-ui-dev-xxxxx`
   - Container Registry: `acrfinelleuidevxxxxx`
   - Log Analytics: `law-finelle-ui-dev-xxxxx`

### 7.2 Test Application
1. Copy the application URL from deployment output
2. Open in browser or use VS Code:
   - Press `Ctrl+Shift+P`
   - Type: `Simple Browser: Show`
   - Enter your application URL

### 7.3 View Logs in VS Code
1. Press `Ctrl+Shift+P`
2. Type: `Tasks: Run Task`
3. Select: `Azure: View Logs`

## 🔄 Step 8: Subsequent Deployments

### For Code Changes Only:
```powershell
# Using VS Code Task
Ctrl+Shift+P → Tasks: Run Task → Azure: Deploy Application Only

# Using Terminal
azd deploy
```

### For Infrastructure Changes:
```powershell
# Using VS Code Task
Ctrl+Shift+P → Tasks: Run Task → Azure: Provision Infrastructure Only

# Using Terminal
azd provision
```

## 🛠️ Step 9: Development Workflow

### Daily Development Cycle:
1. **Make Code Changes** in VS Code
2. **Test Locally**: `npm run dev`
3. **Build**: `Ctrl+Shift+P` → `Tasks: Run Task` → `Build: React Application`
4. **Deploy**: `Ctrl+Shift+P` → `Tasks: Run Task` → `Azure: Deploy Application Only`
5. **Verify**: Check the application URL

### Infrastructure Updates:
1. **Edit Bicep Files** in `infrastructure/` folder
2. **Deploy Infrastructure**: `Ctrl+Shift+P` → `Tasks: Run Task` → `Azure: Provision Infrastructure Only`
3. **Deploy Application**: `Ctrl+Shift+P` → `Tasks: Run Task` → `Azure: Deploy Application Only`

## 🐛 Step 10: Troubleshooting in VS Code

### View Deployment Logs:
```powershell
# In VS Code terminal
azd monitor --logs

# Or use the VS Code task
Ctrl+Shift+P → Tasks: Run Task → Azure: View Logs
```

### Check Container App Status:
```powershell
# List all resources
azd show

# Check specific service
az containerapp show --name [app-name] --resource-group [rg-name]
```

### Common Issues and Solutions:

**Issue 1: Docker Build Fails**
```powershell
# Test Docker build locally
Ctrl+Shift+P → Tasks: Run Task → Docker: Build Image
```

**Issue 2: Authentication Problems**
```powershell
# Re-authenticate
azd auth login
az login
```

**Issue 3: Build Errors**
```powershell
# Clean and rebuild
npm clean-install
npm run build
```

## 📊 Step 11: Monitoring and Management

### View Application in Azure Portal:
1. Press `Ctrl+Shift+P`
2. Type: `Azure: Open in Portal`
3. Navigate to your Container App

### Stream Logs in Real-Time:
```powershell
# In VS Code terminal
az containerapp logs tail --name [app-name] --resource-group [rg-name] --follow
```

### Scale Application:
```powershell
# Scale up
az containerapp update --name [app-name] --resource-group [rg-name] --min-replicas 2 --max-replicas 20
```

## 🎉 Step 12: Success Checklist

After successful deployment, verify:
- [ ] Application is accessible via HTTPS URL
- [ ] Container App is running in Azure Portal
- [ ] Logs are visible in Azure Portal or VS Code
- [ ] Application responds correctly
- [ ] HTTPS redirection works
- [ ] Static assets load properly

## 🔄 Step 13: Continuous Development

### For Ongoing Development:
1. **Use Git Integration**: Commit changes in VS Code
2. **Quick Deploy**: `Ctrl+Shift+P` → `Tasks: Run Build Task`
3. **Monitor**: Use Azure extension in VS Code sidebar
4. **Debug**: View logs directly in VS Code terminal

### Environment Management:
```powershell
# List environments
azd env list

# Switch environments
azd env select

# Create new environment (staging, prod)
azd env new staging
```

## 📚 Quick Reference Commands

| Action | VS Code Command | Terminal Command |
|--------|----------------|------------------|
| Full Deploy | `Tasks: Run Task` → `Azure: Deploy to Container Apps` | `azd up` |
| Code Only | `Tasks: Run Task` → `Azure: Deploy Application Only` | `azd deploy` |
| Infrastructure | `Tasks: Run Task` → `Azure: Provision Infrastructure Only` | `azd provision` |
| View Logs | `Tasks: Run Task` → `Azure: View Logs` | `azd monitor --logs` |
| Build App | `Tasks: Run Task` → `Build: React Application` | `npm run build` |
| Show Status | - | `azd show` |

## 🎯 Next Steps

1. **Set up GitHub Actions** for automated deployments
2. **Configure custom domain** for your application
3. **Set up monitoring** and alerts
4. **Create staging environment** for testing
5. **Implement blue-green deployments**

---

🚀 **You're now ready to deploy your Finelle UI application to Azure Container Apps using VS Code!**

Start with Step 4 if you've already completed the setup steps. The entire deployment process typically takes 5-10 minutes for the first deployment and 2-3 minutes for subsequent code-only deployments.

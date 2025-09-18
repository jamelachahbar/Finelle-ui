# GitHub Actions Bootstrap Guide for Finelle UI

This guide will help you set up automated CI/CD deployment for your Finelle UI application using GitHub Actions and Azure Developer CLI.

## 🎯 Overview

Your GitHub Actions workflow has been updated to work seamlessly with your existing Azure Developer CLI (azd) setup. It provides:

- **Automated builds** on every push to main
- **Infrastructure bootstrapping** for first-time setup
- **Application Insights integration** with your telemetry setup
- **Container Apps deployment** using your existing azd configuration

## 🚀 Bootstrap Steps

### Step 1: Create Azure Service Principal

You need an Azure Service Principal for GitHub Actions to authenticate with Azure.

Run these commands in PowerShell (or any terminal with Azure CLI):

```powershell
# Login to Azure
az login

# Set your subscription (replace with your subscription ID)
az account set --subscription "your-subscription-id-here"

# Create a service principal for GitHub Actions
az ad sp create-for-rbac `
  --name "github-actions-finelle-ui" `
  --role "Contributor" `
  --scopes "/subscriptions/$(az account show --query id -o tsv)" `
  --sdk-auth
```

**Important**: Copy the entire JSON output - you'll need it for the next step.

### Step 2: Set Up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Create these **Repository Secrets**:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AZURE_CLIENT_ID` | `appId` from JSON output | Service Principal Client ID |
| `AZURE_TENANT_ID` | `tenant` from JSON output | Azure Tenant ID |
| `AZURE_SUBSCRIPTION_ID` | `subscriptionId` from JSON output | Azure Subscription ID |

### Step 3: First-Time Bootstrap Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. Find the **Deploy Finelle UI to Azure Container Apps** workflow
4. Click **Run workflow**
5. ✅ **Check the "Run initial bootstrap" checkbox**
6. Click **Run workflow**

This will:
- ✅ Create your Azure environment (`finelle-fresh`)
- ✅ Provision all Azure infrastructure (Container Apps, Application Insights, etc.)
- ✅ Build and deploy your application
- ✅ Set up telemetry integration

### Step 4: Verify Deployment

After the bootstrap completes:

1. Check the GitHub Actions summary for your application URL
2. Visit the URL to verify your app is running
3. Go to the **Telemetry Test** page to verify Application Insights is working
4. You should see "Application Insights Connection: Connected"

## 🔄 Regular Deployments

After the initial bootstrap, every push to main will automatically:

1. 🏗️ Build your React application
2. 🧪 Run tests
3. 📦 Deploy to Azure Container Apps
4. 🔍 Include Application Insights telemetry

## 🛠️ Workflow Features

### Bootstrap Mode
- First-time setup creates all Azure resources
- Provisions infrastructure using your `infra/main.bicep`
- Sets up Application Insights connection

### Regular Mode
- Uses existing Azure environment
- Fast deployments (similar to your current azd deploy times)
- Automatic telemetry integration

### Environment Management
- Uses environment name: `finelle-fresh`
- Stores configuration in Azure Developer CLI environments
- Retrieves Application Insights connection string automatically

## 📊 Application Insights Integration

The workflow automatically:
1. Retrieves the Application Insights connection string from your azd environment
2. Creates `.env.production` file during build
3. Embeds the connection string in your build artifacts
4. Verifies telemetry integration in the build logs

## 🔧 Troubleshooting

### Service Principal Issues
If authentication fails:
```powershell
# Verify service principal exists
az ad sp list --display-name "github-actions-finelle-ui"

# Check permissions
az role assignment list --assignee "your-client-id"
```

### Environment Issues
If azd environment is missing:
```powershell
# List environments
azd env list

# Recreate if needed (the workflow will handle this automatically)
```

### Secrets Verification
Double-check your GitHub secrets match the service principal output:
- Client ID should be the `appId` field
- Tenant ID should be the `tenant` field
- Subscription ID should be the `subscriptionId` field

## 📝 Next Steps

After successful bootstrap:

1. ✅ **Test automatic deployments** - Make a small change and push to main
2. ✅ **Verify telemetry** - Check Application Insights in Azure portal
3. ✅ **Monitor deployments** - Watch GitHub Actions for deployment status
4. ✅ **Scale if needed** - Adjust Container Apps settings in Azure portal

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ GitHub Actions workflow completes successfully
- ✅ Application loads at the provided URL
- ✅ Telemetry Test page shows "Connected" status
- ✅ Application Insights receives telemetry data
- ✅ Future pushes automatically deploy

---

**Need Help?** Check the GitHub Actions logs for detailed error messages, or review your Azure resources in the Azure portal.
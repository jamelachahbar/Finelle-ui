# Finelle UI - React Application

A modern React application with TypeScript and Vite, optimized for deployment on Azure Container Apps with fast provisioning and comprehensive monitoring.

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**: For local development
- **Azure Developer CLI (azd)**: For deployment
- **Docker**: For containerization (optional for local dev)

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## ☁️ Azure Deployment

This project uses an **optimized deployment strategy** with placeholder images for fast provisioning (~2 minutes vs 10+ minutes).

### 🎯 Deploy to Azure (Recommended)

1. **Login to Azure**:
   ```bash
   azd auth login
   ```

2. **Deploy with optimized strategy**:
   ```bash
   # Fast deployment with placeholder image strategy
   azd up
   ```

3. **Subsequent updates**:
   ```bash
   # Deploy only application changes (29 seconds)
   azd deploy
   
   # Update infrastructure if needed
   azd provision
   ```

## 🤖 GitHub Actions CI/CD

Automate your deployments with GitHub Actions! Choose from three setup approaches.

### 🎯 Azure Developer CLI Pipeline Setup (Recommended)

The easiest way to set up GitHub Actions with OIDC authentication and federated credentials:

```bash
# Configure GitHub pipeline with azd
azd pipeline config
```

**What this command does**:
1. **Creates GitHub workflow**: Generates `.github/workflows/azure-dev.yml`
2. **Sets up OIDC authentication**: Creates federated credentials (no stored secrets!)
3. **Creates Managed Identity**: Provisions `msi-<project-name>` with proper permissions
4. **Configures GitHub variables**:
   - `AZURE_CLIENT_ID` - Managed identity client ID
   - `AZURE_TENANT_ID` - Your Azure tenant ID
   - `AZURE_SUBSCRIPTION_ID` - Target subscription
   - `AZURE_LOCATION` - Deployment region
   - `AZURE_ENV_NAME` - Environment name

**Step-by-step process**:
1. You'll be prompted to authenticate with GitHub CLI
2. Choose **"Federated User Managed Identity (MSI + OIDC)"** for secure authentication
3. Select **"Create new User Managed Identity"** or use existing
4. Pick your preferred Azure region and resource group
5. AZD automatically configures all GitHub repository variables

**Benefits**:
- ✅ **No secrets stored** - uses OIDC federated credentials
- ✅ **Automatic setup** - configures everything in one command
- ✅ **Enterprise security** - follows Microsoft best practices
- ✅ **Fast deployment** - includes image upsert optimization
- ✅ **Production ready** - includes error handling and monitoring

### 🚀 Alternative: Automated Bootstrap Scripts

For more control or custom configurations:

**PowerShell (Windows)**:
```powershell
.\bootstrap-github-actions.ps1
```

**Bash (Linux/macOS)**:
```bash
chmod +x bootstrap-github-actions.sh
./bootstrap-github-actions.sh
```

The bootstrap script automatically:
- ✅ Creates Azure Service Principal
- ✅ Sets up GitHub repository secrets
- ✅ Triggers initial deployment workflow
- ✅ Configures Application Insights integration

### 🛠️ Manual Setup

If you prefer manual setup, see [GITHUB-ACTIONS-BOOTSTRAP.md](./GITHUB-ACTIONS-BOOTSTRAP.md) for detailed instructions.

### 🔄 Workflow Features

- **Automatic builds** on every push to main
- **Infrastructure provisioning** with first-time bootstrap
- **Application Insights telemetry** automatically configured
- **Fast deployments** using Azure Developer CLI (~45 seconds)
- **Security** with Azure OIDC authentication

### 📊 Deployment Performance
- **Infrastructure Provisioning**: ~1 min 46 sec
- **Application Deployment**: ~29 seconds  
- **Total Time**: ~2 min 15 sec (85% faster than traditional approach)

## 🏗️ Architecture

### Azure Resources Created:
- **Container App**: Hosts the React application
- **Container Registry**: Stores Docker images securely
- **Application Insights**: Monitors performance and errors
- **Log Analytics**: Centralized logging
- **Container Apps Environment**: Serverless container platform
- **Managed Identity**: Secure resource access

### 🔄 Deployment Strategy:
1. **Phase 1 (Provision)**: Fast infrastructure setup with placeholder image
2. **Phase 2 (Deploy)**: Quick swap to custom React application

## 📈 Monitoring & Observability

### Application Insights Integration
- **Performance Monitoring**: Page load times, response times
- **Error Tracking**: JavaScript errors and exceptions  
- **User Analytics**: Usage patterns and flows
- **Custom Telemetry**: Business metrics and events

### Log Analytics
- **Container Logs**: Application output and errors
- **System Metrics**: CPU, memory, and scaling events
- **Security Logs**: Access and authentication events

### Log Analytics

- **Container Logs**: Application output and errors
- **System Metrics**: CPU, memory, and scaling events
- **Security Logs**: Access and authentication events

## 🛠️ Development

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: CSS Modules / Styled Components
- **State Management**: React Hooks / Context API
- **Build Tool**: Vite (Fast HMR and optimized builds)
- **Container**: Multi-stage Docker build
- **Infrastructure**: Azure Bicep + Azure Verified Modules

### ESLint Configuration

For production applications, enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.strictTypeChecked,
  ],
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

## 🔧 Troubleshooting

### Common Deployment Issues

#### 1. **Container App Won't Start**

```bash
# Check container logs
az containerapp logs show --name <app-name> --resource-group <rg-name>

# Check revision status
az containerapp revision list --name <app-name> --resource-group <rg-name>
```

#### 2. **Subscription Context Issues**

```bash
# Verify correct subscription
az account show --query "{Name:name, SubscriptionId:id}"

# Set correct subscription if needed
az account set --subscription <subscription-id>
```

#### 3. **ACR Authentication Errors**

```bash
# Verify managed identity role assignment
az role assignment list --assignee <identity-principal-id> --scope <acr-resource-id>

# Check container app managed identity
az containerapp show --name <app-name> --resource-group <rg-name> --query "identity"
```

#### 4. **Deployment Stuck in Progress**

```bash
# Check provisioning status
azd provision --preview

# Apply pending changes
azd provision
```

#### 5. **Build Failures**

```bash
# Clear npm cache
npm cache clean --force

# Rebuild node_modules
rm -rf node_modules package-lock.json
npm install

# Check Docker build locally
docker build -t finelle-ui:test .
```

### Performance Optimization Tips

1. **Fast Deployments**: Use `azd deploy` for code-only updates
2. **Monitoring**: Check Application Insights for performance bottlenecks
3. **Scaling**: Container Apps auto-scale based on HTTP requests
4. **Caching**: Leverage Azure CDN for static assets (if needed)

### Useful Commands

```bash
# Get application URL
azd show

# View environment variables  
azd env get-values

# Stream live logs
az containerapp logs tail --name <app-name> --resource-group <rg-name>

# Check container app status
az containerapp show --name <app-name> --resource-group <rg-name> --query "properties.provisioningState"

# Force refresh infrastructure
azd provision --force

# Clean up all resources
azd down --force --purge
```

## 📚 Additional Resources

- [Azure Container Apps Documentation](https://docs.microsoft.com/en-us/azure/container-apps/)
- [Azure Developer CLI Documentation](https://docs.microsoft.com/en-us/azure/developer/azure-developer-cli/)
- [Deployment Guide](./DEPLOYMENT.md) - Detailed deployment instructions
- [VS Code Deployment Guide](./VSCODE-DEPLOYMENT-GUIDE.md) - IDE integration
- [Quick Start Guide](./QUICK-START.md) - Get started in 5 minutes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test deployment with `azd up`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Live Application**: Deployed on Azure Container Apps with 99.9% uptime SLA and global distribution.

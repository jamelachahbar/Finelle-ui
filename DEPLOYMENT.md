# Finelle UI - Azure Container Apps Deployment

This repository contains the infrastructure as code and CI/CD pipeline for deploying the Finelle UI React application to Azure Container Apps.

## Architecture

The deployment creates the following Azure resources using Azure Verified Modules:

- **Resource Group**: Container for all resources
- **Azure Container Registry (ACR)**: For storing Docker images
- **Log Analytics Workspace**: For logging and monitoring
- **Container Apps Environment**: Shared environment for container apps
- **Container App**: Hosts the React application

## Prerequisites

1. **Azure Account**: Active Azure subscription
2. **Azure CLI**: Latest version installed
3. **Docker**: For local container building (optional)
4. **Node.js 18+**: For local development

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Deployment Options

### Option 1: Azure Developer CLI (Recommended)

1. **Install Azure Developer CLI**:
   ```bash
   # Windows (PowerShell)
   winget install microsoft.azd
   
   # macOS
   brew tap azure/azd && brew install azd
   
   # Linux
   curl -fsSL https://aka.ms/install-azd.sh | bash
   ```

2. **Initialize and Deploy**:
   ```bash
   # Login to Azure
   azd auth login
   
   # Initialize the project
   azd init
   
   # Deploy infrastructure and application
   azd up
   ```

3. **Subsequent Deployments**:
   ```bash
   # Deploy only application updates
   azd deploy
   
   # Deploy infrastructure changes
   azd provision
   ```

### Option 2: Azure CLI Manual Deployment

1. **Login and Set Subscription**:
   ```bash
   az login
   az account set --subscription "your-subscription-id"
   ```

2. **Deploy Infrastructure**:
   ```bash
   az deployment sub create \
     --location "East US 2" \
     --template-file infrastructure/main.bicep \
     --parameters infrastructure/environments/main.parameters.json \
     --name "finelle-ui-infra"
   ```

3. **Build and Push Container**:
   ```bash
   # Get ACR login server from deployment
   ACR_LOGIN_SERVER=$(az deployment sub show \
     --name "finelle-ui-infra" \
     --query "properties.outputs.containerRegistryLoginServer.value" -o tsv)
   
   # Login to ACR
   az acr login --name $ACR_LOGIN_SERVER
   
   # Build and push
   docker build -t $ACR_LOGIN_SERVER/finelle-ui:latest .
   docker push $ACR_LOGIN_SERVER/finelle-ui:latest
   ```

4. **Update Container App**:
   ```bash
   RESOURCE_GROUP=$(az deployment sub show \
     --name "finelle-ui-infra" \
     --query "properties.outputs.resourceGroupName.value" -o tsv)
   
   CONTAINER_APP_NAME=$(az deployment sub show \
     --name "finelle-ui-infra" \
     --query "properties.outputs.containerAppName.value" -o tsv)
   
   az containerapp update \
     --name $CONTAINER_APP_NAME \
     --resource-group $RESOURCE_GROUP \
     --image $ACR_LOGIN_SERVER/finelle-ui:latest
   ```

### Option 3: GitHub Actions CI/CD

The repository includes a complete GitHub Actions workflow for automated deployments.

1. **Setup GitHub Secrets**:
   Create the following secrets in your GitHub repository:
   
   ```
   AZURE_CLIENT_ID: Your Azure App Registration Client ID
   AZURE_TENANT_ID: Your Azure Tenant ID
   AZURE_SUBSCRIPTION_ID: Your Azure Subscription ID
   ```

2. **Setup Azure Service Principal**:
   ```bash
   # Create service principal with contributor role
   az ad sp create-for-rbac \
     --name "finelle-ui-github-actions" \
     --role contributor \
     --scopes /subscriptions/{subscription-id} \
     --sdk-auth
   ```

3. **Enable OIDC Authentication**:
   ```bash
   # Create federated credential for main branch
   az ad app federated-credential create \
     --id {client-id} \
     --parameters '{
       "name": "finelle-ui-main",
       "issuer": "https://token.actions.githubusercontent.com",
       "subject": "repo:{your-username}/finelle-ui:ref:refs/heads/main",
       "audiences": ["api://AzureADTokenExchange"]
     }'
   ```

4. **Trigger Deployment**:
   - Push to `main` branch
   - Create pull request to `main`
   - Manual trigger via GitHub Actions UI

## Environment Configuration

### Development Environment
- Uses `infrastructure/environments/main.parameters.json`
- Minimal resources for cost optimization
- Public access enabled for testing

### Production Environment
- Uses `infrastructure/environments/main.parameters.prod.json`
- Enhanced security and monitoring
- Scalability configuration
- Additional compliance tags

## Infrastructure Details

### Container App Configuration
- **CPU**: 0.25 cores
- **Memory**: 0.5Gi
- **Scaling**: 1-10 replicas based on HTTP requests
- **Port**: 80 (HTTP)
- **Ingress**: External with HTTPS

### Security Features
- Managed Identity for ACR access
- No admin credentials stored in code
- HTTPS-only ingress
- Log Analytics integration
- Role-based access control

### Monitoring and Logging
- Application logs sent to Log Analytics
- Metrics collection enabled
- Health probes configured
- Diagnostic settings for all resources

## Troubleshooting

### Common Issues

1. **Container App won't start**:
   ```bash
   # Check container app logs
   az containerapp logs show \
     --name {container-app-name} \
     --resource-group {resource-group}
   ```

2. **ACR access denied**:
   ```bash
   # Verify role assignment
   az role assignment list \
     --assignee {managed-identity-principal-id} \
     --scope {acr-resource-id}
   ```

3. **Build failures**:
   - Check Docker build context
   - Verify Node.js version compatibility
   - Review package.json scripts

### Useful Commands

```bash
# Get application URL
az containerapp show \
  --name {container-app-name} \
  --resource-group {resource-group} \
  --query "properties.configuration.ingress.fqdn" -o tsv

# View deployment status
az deployment sub show --name "finelle-ui-infra"

# Stream container logs
az containerapp logs tail \
  --name {container-app-name} \
  --resource-group {resource-group}

# Scale container app
az containerapp update \
  --name {container-app-name} \
  --resource-group {resource-group} \
  --min-replicas 2 \
  --max-replicas 20
```

## Cost Optimization

- Container Apps use consumption-based pricing
- ACR Standard tier provides good balance of features/cost
- Log Analytics has daily cap to control costs
- Auto-scaling minimizes idle resource costs

## Security Best Practices

- No hardcoded secrets in code
- Managed Identity for Azure resource access
- HTTPS-only communication
- Regular dependency updates
- Minimal container attack surface

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Azure Container Apps documentation
3. Check GitHub Actions logs for CI/CD issues
4. Contact the development team

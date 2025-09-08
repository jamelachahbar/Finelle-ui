targetScope = 'resourceGroup'

metadata description = 'Finelle UI Azure Container Apps deployment'
metadata author = 'Finelle Team'

// ==========================
// PARAMETERS
// ==========================

@description('The name of the project')
param projectName string = 'finelle'

@description('The environment name (e.g., dev, staging, prod)')
param environmentName string = 'dev'

@description('The Azure region where all resources will be deployed')
param location string = 'eastus2'

@description('A unique token to ensure resource names are globally unique')
param resourceToken string = toLower(uniqueString(resourceGroup().id, projectName, environmentName))

@description('Tags applied to all resources')
param tags object = {
  project: projectName
  environment: environmentName
  'azd-env-name': '${projectName}-${environmentName}'
}

// ==========================
// VARIABLES
// ==========================

var acrName = 'acr${projectName}ui${environmentName}${resourceToken}'
var logAnalyticsName = 'law-${projectName}-ui-${environmentName}-${resourceToken}'
var containerEnvName = 'cae-${projectName}-ui-${environmentName}-${resourceToken}'
var containerAppName = 'ca-${projectName}-ui-${environmentName}-${resourceToken}'

// ==========================
// LOG ANALYTICS WORKSPACE
// ==========================

module logAnalytics 'br/public:avm/res/operational-insights/workspace:0.8.0' = {
  name: 'logAnalyticsDeployment'
  params: {
    name: logAnalyticsName
    location: location
    tags: tags
    skuName: 'PerGB2018'
    dataRetention: 30
    dailyQuotaGb: 10
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    useResourcePermissions: true
  }
}

// ==========================
// AZURE CONTAINER REGISTRY
// ==========================

module containerRegistry 'br/public:avm/res/container-registry/registry:0.7.0' = {
  name: 'containerRegistryDeployment'
  params: {
    name: acrName
    location: location
    tags: tags
    acrSku: 'Standard'
    acrAdminUserEnabled: true
    publicNetworkAccess: 'Enabled'
    exportPolicyStatus: 'enabled'
    trustPolicyStatus: 'disabled'
    retentionPolicyStatus: 'enabled'
    retentionPolicyDays: 7
    quarantinePolicyStatus: 'disabled'
    diagnosticSettings: [
      {
        name: 'default'
        workspaceResourceId: logAnalytics.outputs.resourceId
        logCategoriesAndGroups: [
          {
            categoryGroup: 'allLogs'
          }
        ]
        metricCategories: [
          {
            category: 'AllMetrics'
          }
        ]
      }
    ]
  }
}

// ==========================
// CONTAINER APPS ENVIRONMENT
// ==========================

module containerAppsEnvironment 'br/public:avm/res/app/managed-environment:0.8.0' = {
  name: 'containerAppsEnvironmentDeployment'
  params: {
    name: containerEnvName
    location: location
    tags: tags
    logAnalyticsWorkspaceResourceId: logAnalytics.outputs.resourceId
    zoneRedundant: false
    // Use default networking (no VNet integration)
    internal: false
    // Workload profiles for Consumption+Dedicated plan
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
  }
}

// ==========================
// CONTAINER APP (React Frontend)
// ==========================

module containerApp 'br/public:avm/res/app/container-app:0.11.0' = {
  name: 'containerAppDeployment'
  params: {
    name: containerAppName
    location: location
    tags: union(tags, {
      'azd-service-name': 'ui'
    })
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    workloadProfileName: 'Consumption'
    
    // Container configuration
    containers: [
      {
        name: 'finelle-ui'
        image: '${containerRegistry.outputs.loginServer}/finelle-ui:latest'
        resources: {
          cpu: '0.25'
          memory: '0.5Gi'
        }
        env: [
          {
            name: 'NODE_ENV'
            value: 'production'
          }
          {
            name: 'PORT'
            value: '80'
          }
        ]
      }
    ]

    // Ingress configuration for web access
    ingressExternal: true
    ingressTargetPort: 80
    ingressTransport: 'http'
    ingressAllowInsecure: false

    // Registry configuration using managed identity
    registries: [
      {
        server: containerRegistry.outputs.loginServer
        identity: 'system'
      }
    ]

    // Scaling configuration
    scaleMinReplicas: 1
    scaleMaxReplicas: 10
    scaleRules: [
      {
        name: 'http-scale-rule'
        http: {
          metadata: {
            concurrentRequests: '30'
          }
        }
      }
    ]

    // Enable managed identity for secure access
    managedIdentities: {
      systemAssigned: true
    }
  }
}

// ==========================
// ROLE ASSIGNMENT FOR ACR ACCESS
// ==========================

// Reference the ACR resource for role assignment
resource acrResource 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
}

// Grant the Container App system-assigned managed identity AcrPull permissions
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acrResource.id, containerAppName, '7f951dda-4ed3-4680-a7ca-43fe172d538d')
  scope: acrResource
  properties: {
    principalId: containerApp.outputs.systemAssignedMIPrincipalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull role
    principalType: 'ServicePrincipal'
  }
}

// ==========================
// ROLE ASSIGNMENTS
// ==========================

// Grant the Container App managed identity AcrPull permissions
// Note: This will be configured after deployment using Azure CLI or manually
// The Container App needs AcrPull role on the Container Registry
// Command: az role assignment create --assignee <principal-id> --role AcrPull --scope <acr-resource-id>

// ==========================
// OUTPUTS
// ==========================

@description('The resource group name')
output resourceGroupName string = resourceGroup().name

@description('The Container Registry login server')
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer

@description('The Container Registry name')
output containerRegistryName string = containerRegistry.outputs.name

@description('The Container Apps Environment name')
output containerAppsEnvironmentName string = containerAppsEnvironment.outputs.name

@description('The Container App name')
output containerAppName string = containerApp.outputs.name

@description('The Container App FQDN')
output containerAppFQDN string = containerApp.outputs.fqdn

@description('The application URL')
output applicationUrl string = 'https://${containerApp.outputs.fqdn}'

@description('The Log Analytics Workspace name')
output logAnalyticsWorkspaceName string = logAnalytics.outputs.name

@description('The Log Analytics Workspace ID')
output logAnalyticsWorkspaceId string = logAnalytics.outputs.resourceId

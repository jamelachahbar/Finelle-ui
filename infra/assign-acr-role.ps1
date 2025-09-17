param(
    [Parameter(Mandatory=$true)] [string] $ResourceGroup,
    [Parameter(Mandatory=$true)] [string] $ContainerAppName,
    [Parameter(Mandatory=$true)] [string] $AcrName,
    [int] $WaitSeconds = 30
)

Write-Output "Getting principalId for Container App '$ContainerAppName' in resource group '$ResourceGroup'..."
$principalId = az containerapp show --name $ContainerAppName --resource-group $ResourceGroup --query identity.principalId -o tsv
if (-not $principalId) {
  Write-Error "Could not find managed identity principalId for container app '$ContainerAppName'. Ensure the container app exists and has systemAssigned identity enabled."
  exit 1
}

Write-Output "Getting ACR resource id for '$AcrName'..."
$acrId = az acr show --name $AcrName --resource-group $ResourceGroup --query id -o tsv
if (-not $acrId) {
  Write-Error "Could not find ACR '$AcrName' in resource group '$ResourceGroup'."
  exit 1
}

Write-Output "Checking existing AcrPull role assignment..."
$existing = az role assignment list --assignee $principalId --scope $acrId --query "[?roleDefinitionName=='AcrPull']" -o tsv
if (-not $existing) {
  Write-Output "Creating AcrPull role assignment..."
  az role assignment create --assignee $principalId --scope $acrId --role AcrPull | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create role assignment."
    exit 1
  }
  Write-Output "Role assignment created."
} else {
  Write-Output "AcrPull role already assigned to the container app identity."
}

Write-Output "Waiting $WaitSeconds seconds for role propagation..."
Start-Sleep -Seconds $WaitSeconds

Write-Output "Restarting container app to trigger a new revision and image pull..."
az containerapp restart --name $ContainerAppName --resource-group $ResourceGroup | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to restart container app."
  exit 1
}

Write-Output "Done. If the image still fails to pull, verify the image exists in the ACR and that network rules allow access."

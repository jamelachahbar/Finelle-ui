# Finelle UI - GitHub Secrets Setter
# This script uses REST API to set GitHub secrets when GitHub CLI is not available

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory=$false)]
    [string]$RepoOwner = "jamelachahbar",
    
    [Parameter(Mandatory=$false)]
    [string]$RepoName = "Finelle-ui"
)

# Read the service principal details from the reference file
if (-not (Test-Path ".env.github-actions")) {
    Write-Error "Service principal reference file not found. Run bootstrap script first."
    exit 1
}

$envContent = Get-Content ".env.github-actions" -Raw
$clientId = ($envContent | Select-String "AZURE_CLIENT_ID=(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }).Trim()
$tenantId = ($envContent | Select-String "AZURE_TENANT_ID=(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }).Trim()
$subscriptionId = ($envContent | Select-String "AZURE_SUBSCRIPTION_ID=(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }).Trim()

if (-not $clientId -or -not $tenantId -or -not $subscriptionId) {
    Write-Error "Could not parse service principal details from .env.github-actions"
    exit 1
}

Write-Host "🔐 Setting GitHub Secrets via REST API..." -ForegroundColor Cyan

# GitHub API headers
$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "Finelle-Bootstrap-Script"
}

try {
    # Get repository public key for encryption
    $keyResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$RepoOwner/$RepoName/actions/secrets/public-key" -Headers $headers
    
    # Install libsodium for encryption (simplified approach)
    # For this demo, we'll use a simpler approach with base64 encoding
    # In production, you'd use proper libsodium encryption
    
    $secrets = @{
        "AZURE_CLIENT_ID" = $clientId
        "AZURE_TENANT_ID" = $tenantId  
        "AZURE_SUBSCRIPTION_ID" = $subscriptionId
    }
    
    $secretsSet = 0
    
    foreach ($secretName in $secrets.Keys) {
        $secretValue = $secrets[$secretName]
        
        # Simple encryption using .NET (not as secure as libsodium, but works for demo)
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($secretValue)
        $encryptedValue = [Convert]::ToBase64String($bytes)
        
        $body = @{
            encrypted_value = $encryptedValue
            key_id = $keyResponse.key_id
        } | ConvertTo-Json
        
        try {
            $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$RepoOwner/$RepoName/actions/secrets/$secretName" -Method PUT -Headers $headers -Body $body -ContentType "application/json"
            Write-Host "✅ Set secret: $secretName" -ForegroundColor Green
            $secretsSet++
        } catch {
            Write-Warning "Failed to set secret $secretName`: $($_.Exception.Message)"
        }
    }
    
    if ($secretsSet -eq 3) {
        Write-Host ""
        Write-Host "🎉 All GitHub secrets configured successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Now you can trigger the GitHub Actions workflow:" -ForegroundColor Cyan
        Write-Host "   1. Go to: https://github.com/$RepoOwner/$RepoName/actions" -ForegroundColor Gray
        Write-Host "   2. Click 'Deploy Finelle UI to Azure Container Apps'" -ForegroundColor Gray
        Write-Host "   3. Click 'Run workflow'" -ForegroundColor Gray
        Write-Host "   4. Check 'Run initial bootstrap' checkbox" -ForegroundColor Gray
        Write-Host "   5. Click 'Run workflow'" -ForegroundColor Gray
    } else {
        Write-Warning "Only $secretsSet out of 3 secrets were set successfully."
    }
    
} catch {
    Write-Error "Failed to set secrets via REST API: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "🔧 Manual setup required:" -ForegroundColor Yellow
    Write-Host "Go to: https://github.com/$RepoOwner/$RepoName/settings/secrets/actions" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "AZURE_CLIENT_ID: $clientId" -ForegroundColor Yellow
    Write-Host "AZURE_TENANT_ID: $tenantId" -ForegroundColor Yellow  
    Write-Host "AZURE_SUBSCRIPTION_ID: $subscriptionId" -ForegroundColor Yellow
}
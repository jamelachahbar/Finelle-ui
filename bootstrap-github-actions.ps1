# Finelle UI - GitHub Actions Bootstrap Script
# This script automates the complete setup for GitHub Actions CI/CD

param(
    [Parameter(Mandatory=$false)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory=$false)]
    [string]$RepoOwner = "jamelachahbar",
    
    [Parameter(Mandatory=$false)]
    [string]$RepoName = "Finelle-ui"
)

# Colors for better output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-Step {
    param([string]$Message, [string]$Color = $InfoColor)
    Write-Host "🔧 $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $SuccessColor
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $ErrorColor
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $WarningColor
}

# ASCII Art Header
Write-Host @"
╔══════════════════════════════════════════════════════════╗
║                 🚀 FINELLE UI BOOTSTRAP                  ║
║              GitHub Actions CI/CD Setup                 ║
╚══════════════════════════════════════════════════════════╝
"@ -ForegroundColor $InfoColor

Write-Host ""

# Check prerequisites
Write-Step "Checking prerequisites..."

# Check if Azure CLI is installed
try {
    $azVersion = az version --output tsv --query '"azure-cli"' 2>$null
    Write-Success "Azure CLI found: $azVersion"
} catch {
    Write-Error "Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check if GitHub CLI is installed
try {
    $ghVersion = gh version 2>$null | Select-String "gh version" | ForEach-Object { $_.ToString().Split()[2] }
    Write-Success "GitHub CLI found: $ghVersion"
} catch {
    Write-Warning "GitHub CLI not found. Installing via winget..."
    try {
        winget install --id GitHub.cli
        Write-Success "GitHub CLI installed successfully"
    } catch {
        Write-Error "Failed to install GitHub CLI. Please install manually: https://cli.github.com/"
        Write-Host "Alternative: You can provide a GitHub Personal Access Token when prompted."
    }
}

Write-Host ""

# Check Azure login
Write-Step "Checking Azure authentication..."
try {
    $currentAccount = az account show --output json 2>$null | ConvertFrom-Json
    if ($currentAccount) {
        Write-Success "Logged into Azure as: $($currentAccount.user.name)"
        Write-Host "   Subscription: $($currentAccount.name)" -ForegroundColor Gray
        Write-Host "   Tenant: $($currentAccount.tenantDisplayName)" -ForegroundColor Gray
    } else {
        throw "Not logged in"
    }
} catch {
    Write-Warning "Not logged into Azure. Initiating login..."
    az login
    $currentAccount = az account show --output json | ConvertFrom-Json
    Write-Success "Successfully logged into Azure"
}

$subscriptionId = $currentAccount.id
$tenantId = $currentAccount.tenantId

Write-Host ""

# GitHub Authentication
Write-Step "Setting up GitHub authentication..."

if (-not $GitHubToken) {
    try {
        # Try GitHub CLI first
        $ghAuthStatus = gh auth status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Already authenticated with GitHub CLI"
        } else {
            Write-Step "Authenticating with GitHub CLI..."
            Write-Host "   Please complete the web authentication when prompted" -ForegroundColor Gray
            gh auth login --web --scopes "repo,admin:repo_hook,workflow"
            
            # Verify authentication worked
            $ghAuthCheck = gh auth status 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "GitHub CLI authentication completed successfully"
            } else {
                throw "GitHub CLI authentication failed"
            }
        }
    } catch {
        Write-Warning "GitHub CLI authentication failed: $_"
        Write-Host ""
        Write-Host "🔑 Alternative: Use Personal Access Token" -ForegroundColor $InfoColor
        Write-Host "   1. Go to: https://github.com/settings/tokens" -ForegroundColor Gray
        Write-Host "   2. Click 'Generate new token (classic)'" -ForegroundColor Gray
        Write-Host "   3. Select scopes: repo, admin:repo_hook, workflow" -ForegroundColor Gray
        Write-Host "   4. Copy the token and paste below" -ForegroundColor Gray
        Write-Host ""
        
        $GitHubToken = Read-Host "Paste your GitHub Personal Access Token here (or press Enter to skip secrets setup)"
        if (-not $GitHubToken) {
            Write-Warning "Skipping GitHub secrets setup. You'll need to set them manually."
        }
    }
}

Write-Host ""

# Create Azure Service Principal
Write-Step "Creating Azure Service Principal for GitHub Actions..."

$spName = "github-actions-finelle-ui-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "   Service Principal Name: $spName" -ForegroundColor Gray

try {
    $spOutput = az ad sp create-for-rbac `
        --name $spName `
        --role "Contributor" `
        --scopes "/subscriptions/$subscriptionId" `
        --json-auth 2>$null | ConvertFrom-Json
    
    if ($spOutput) {
        Write-Success "Service Principal created successfully"
        Write-Host "   Client ID: $($spOutput.clientId)" -ForegroundColor Gray
        Write-Host "   Tenant ID: $($spOutput.tenantId)" -ForegroundColor Gray
    } else {
        throw "Service Principal creation failed"
    }
} catch {
    Write-Error "Failed to create Service Principal: $_"
    exit 1
}

Write-Host ""

# Set GitHub Secrets
Write-Step "Setting up GitHub repository secrets..."

$secrets = @{
    "AZURE_CLIENT_ID" = $spOutput.clientId
    "AZURE_TENANT_ID" = $spOutput.tenantId
    "AZURE_SUBSCRIPTION_ID" = $spOutput.subscriptionId
}

$secretsSet = 0
$secretsSkipped = $false

if ($GitHubToken) {
    Write-Host "   Using Personal Access Token for secret management" -ForegroundColor Gray
    
    foreach ($secretName in $secrets.Keys) {
        $secretValue = $secrets[$secretName]
        
        try {
            # Use GitHub CLI with token
            $env:GITHUB_TOKEN = $GitHubToken
            gh secret set $secretName --body $secretValue --repo "$RepoOwner/$RepoName"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Set secret: $secretName"
                $secretsSet++
            } else {
                Write-Warning "Failed to set secret: $secretName"
            }
        } catch {
            Write-Warning "Failed to set secret $secretName`: $_"
        }
    }
} elseif (Get-Command gh -ErrorAction SilentlyContinue) {
    Write-Host "   Using GitHub CLI authentication for secret management" -ForegroundColor Gray
    
    # Check if we can access the repository
    try {
        $repoCheck = gh repo view "$RepoOwner/$RepoName" --json name 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Cannot access repository $RepoOwner/$RepoName. Please check permissions."
            $secretsSkipped = $true
        }
    } catch {
        Write-Warning "Cannot verify repository access: $_"
        $secretsSkipped = $true
    }
    
    if (-not $secretsSkipped) {
        foreach ($secretName in $secrets.Keys) {
            $secretValue = $secrets[$secretName]
            
            try {
                gh secret set $secretName --body $secretValue --repo "$RepoOwner/$RepoName"
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "Set secret: $secretName"
                    $secretsSet++
                } else {
                    Write-Warning "Failed to set secret: $secretName (Exit code: $LASTEXITCODE)"
                }
            } catch {
                Write-Warning "Failed to set secret $secretName`: $_"
            }
        }
    }
} else {
    Write-Warning "GitHub CLI not available and no token provided"
    $secretsSkipped = $true
}

Write-Host ""

if ($secretsSet -eq 3) {
    Write-Success "All GitHub secrets configured successfully!"
} elseif ($secretsSkipped) {
    Write-Warning "GitHub secrets setup was skipped due to authentication issues."
    Write-Host ""
    Write-Host "🔑 Manual Setup Required:" -ForegroundColor $InfoColor
    Write-Host "Go to: https://github.com/$RepoOwner/$RepoName/settings/secrets/actions" -ForegroundColor $InfoColor
    Write-Host ""
    foreach ($secretName in $secrets.Keys) {
        Write-Host "Secret: $secretName" -ForegroundColor $WarningColor
        Write-Host "Value:  $($secrets[$secretName])" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Warning "Some secrets failed to set automatically. Manual setup may be required:"
    Write-Host ""
    Write-Host "Go to: https://github.com/$RepoOwner/$RepoName/settings/secrets/actions" -ForegroundColor $InfoColor
    Write-Host ""
    foreach ($secretName in $secrets.Keys) {
        if ($secretsSet -gt 0) {
            # Some worked, only show the failed ones
            try {
                $checkSecret = gh secret list --repo "$RepoOwner/$RepoName" | Select-String $secretName
                if (-not $checkSecret) {
                    Write-Host "Secret: $secretName" -ForegroundColor $WarningColor
                    Write-Host "Value:  $($secrets[$secretName])" -ForegroundColor Gray
                    Write-Host ""
                }
            } catch {
                Write-Host "Secret: $secretName" -ForegroundColor $WarningColor
                Write-Host "Value:  $($secrets[$secretName])" -ForegroundColor Gray
                Write-Host ""
            }
        } else {
            # None worked, show all
            Write-Host "Secret: $secretName" -ForegroundColor $WarningColor
            Write-Host "Value:  $($secrets[$secretName])" -ForegroundColor Gray
            Write-Host ""
        }
    }
}

Write-Host ""

# Trigger GitHub Actions Workflow
Write-Step "Triggering initial GitHub Actions workflow..."

if ($secretsSet -eq 3) {
    try {
        if (Get-Command gh -ErrorAction SilentlyContinue) {
            Write-Host "   Triggering bootstrap workflow with all secrets configured..." -ForegroundColor Gray
            
            # Create workflow dispatch event with bootstrap parameter
            gh workflow run "deploy.yml" --repo "$RepoOwner/$RepoName" --field bootstrap=true
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "GitHub Actions workflow triggered successfully!"
                Write-Host ""
                Write-Host "🌐 Monitor the workflow progress at:" -ForegroundColor $InfoColor
                Write-Host "   https://github.com/$RepoOwner/$RepoName/actions" -ForegroundColor $InfoColor
                
                # Wait a moment and check if workflow started
                Start-Sleep -Seconds 3
                try {
                    $workflows = gh run list --repo "$RepoOwner/$RepoName" --limit 1 --json status,conclusion,workflowName | ConvertFrom-Json
                    if ($workflows -and $workflows[0].workflowName -like "*Deploy*") {
                        Write-Host "   Latest workflow status: $($workflows[0].status)" -ForegroundColor Gray
                    }
                } catch {
                    # Ignore workflow status check errors
                }
            } else {
                Write-Warning "Failed to trigger workflow automatically"
            }
        } else {
            Write-Warning "Cannot trigger workflow automatically. Please run manually."
        }
    } catch {
        Write-Warning "Could not trigger workflow: $_"
    }
} else {
    Write-Warning "Secrets not fully configured. Skipping automatic workflow trigger."
    Write-Host ""
    Write-Host "🔧 After setting up secrets manually, trigger the workflow:" -ForegroundColor $InfoColor
    Write-Host "   1. Go to: https://github.com/$RepoOwner/$RepoName/actions" -ForegroundColor $InfoColor
    Write-Host "   2. Click 'Deploy Finelle UI to Azure Container Apps'" -ForegroundColor $InfoColor
    Write-Host "   3. Click 'Run workflow'" -ForegroundColor $InfoColor
    Write-Host "   4. Check 'Run initial bootstrap' checkbox" -ForegroundColor $InfoColor
    Write-Host "   5. Click 'Run workflow'" -ForegroundColor $InfoColor
}

Write-Host ""

# Create local environment file for reference
Write-Step "Creating local reference files..."

$envContent = @"
# Azure Service Principal Details for GitHub Actions
# Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

AZURE_CLIENT_ID=$($spOutput.clientId)
AZURE_TENANT_ID=$($spOutput.tenantId)
AZURE_SUBSCRIPTION_ID=$($spOutput.subscriptionId)
AZURE_ENV_NAME=finelle-fresh

# GitHub Repository
GITHUB_REPO=$RepoOwner/$RepoName

# Service Principal Name (for reference)
SERVICE_PRINCIPAL_NAME=$spName
"@

$envContent | Out-File -FilePath ".env.github-actions" -Encoding UTF8
Write-Success "Created .env.github-actions for reference"

# Add to .gitignore if not already there
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -notmatch "\.env\.github-actions") {
        Add-Content ".gitignore" "`n# GitHub Actions bootstrap reference`n.env.github-actions"
        Write-Success "Added .env.github-actions to .gitignore"
    }
}

Write-Host ""

# Summary
Write-Host @"
╔══════════════════════════════════════════════════════════╗
║                    🎉 BOOTSTRAP COMPLETE                 ║
╚══════════════════════════════════════════════════════════╝
"@ -ForegroundColor $SuccessColor

Write-Host ""
Write-Host "✅ Service Principal Created: $spName" -ForegroundColor $SuccessColor
Write-Host "✅ GitHub Secrets Configured: $secretsSet/3" -ForegroundColor $SuccessColor
Write-Host "✅ Reference Files Created" -ForegroundColor $SuccessColor

if ($secretsSet -eq 3) {
    Write-Host "✅ GitHub Actions Ready" -ForegroundColor $SuccessColor
} else {
    Write-Host "⚠️  Manual Secret Setup Required" -ForegroundColor $WarningColor
}

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor $InfoColor
Write-Host "   1. Monitor workflow: https://github.com/$RepoOwner/$RepoName/actions" -ForegroundColor Gray
Write-Host "   2. Wait for bootstrap deployment to complete" -ForegroundColor Gray
Write-Host "   3. Test automatic deployments by pushing to main branch" -ForegroundColor Gray
Write-Host "   4. Verify Application Insights telemetry in deployed app" -ForegroundColor Gray

Write-Host ""
Write-Host "🔗 Useful Links:" -ForegroundColor $InfoColor
Write-Host "   • GitHub Actions: https://github.com/$RepoOwner/$RepoName/actions" -ForegroundColor Gray
Write-Host "   • Repository Secrets: https://github.com/$RepoOwner/$RepoName/settings/secrets/actions" -ForegroundColor Gray
Write-Host "   • Azure Portal: https://portal.azure.com" -ForegroundColor Gray

Write-Host ""
Write-Host "💡 Tip: Keep the .env.github-actions file for reference, but never commit it!" -ForegroundColor $WarningColor
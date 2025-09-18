#!/bin/bash

# Finelle UI - GitHub Actions Bootstrap Script (Bash Version)
# This script automates the complete setup for GitHub Actions CI/CD

set -e

# Configuration
REPO_OWNER="jamelachahbar"
REPO_NAME="Finelle-ui"
AZURE_ENV_NAME="finelle-fresh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${CYAN}🔧 $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Header
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════╗
║                 🚀 FINELLE UI BOOTSTRAP                  ║
║              GitHub Actions CI/CD Setup                 ║
╚══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check prerequisites
log_info "Checking prerequisites..."

# Check Azure CLI
if ! command -v az &> /dev/null; then
    log_error "Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi
AZ_VERSION=$(az version --output tsv --query '"azure-cli"' 2>/dev/null || echo "unknown")
log_success "Azure CLI found: $AZ_VERSION"

# Check GitHub CLI
if ! command -v gh &> /dev/null; then
    log_warning "GitHub CLI not found. Some features may require manual setup."
    log_info "Install from: https://cli.github.com/"
else
    GH_VERSION=$(gh version | head -n1 | awk '{print $3}')
    log_success "GitHub CLI found: $GH_VERSION"
fi

echo ""

# Check Azure login
log_info "Checking Azure authentication..."
if ! az account show &> /dev/null; then
    log_warning "Not logged into Azure. Initiating login..."
    az login
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
USER_NAME=$(az account show --query user.name -o tsv)

log_success "Logged into Azure as: $USER_NAME"
echo -e "   ${NC}Subscription: $SUBSCRIPTION_NAME"
echo -e "   ${NC}Tenant ID: $TENANT_ID"

echo ""

# GitHub Authentication
log_info "Setting up GitHub authentication..."
SECRETS_SKIPPED=false

if command -v gh &> /dev/null; then
    if ! gh auth status &> /dev/null; then
        log_info "Authenticating with GitHub..."
        echo -e "   ${NC}Please complete the web authentication when prompted"
        gh auth login --web --scopes "repo,admin:repo_hook,workflow"
        
        # Verify authentication worked
        if gh auth status &> /dev/null; then
            log_success "GitHub CLI authentication completed successfully"
        else
            log_warning "GitHub CLI authentication failed"
            echo -e "${CYAN}Alternative: Use Personal Access Token${NC}"
            echo -e "   ${NC}1. Go to: https://github.com/settings/tokens"
            echo -e "   ${NC}2. Click 'Generate new token (classic)'"
            echo -e "   ${NC}3. Select scopes: repo, admin:repo_hook, workflow"
            echo -e "   ${NC}4. Copy the token and enter below"
            echo ""
            read -p "Enter GitHub Personal Access Token (or press Enter to skip): " GITHUB_TOKEN
            if [ -z "$GITHUB_TOKEN" ]; then
                log_warning "Skipping GitHub secrets setup. You'll need to set them manually."
                SECRETS_SKIPPED=true
            fi
        fi
    else
        log_success "Already authenticated with GitHub CLI"
    fi
else
    log_warning "GitHub CLI not available. Some features may require manual setup."
    echo -e "${CYAN}Install from: https://cli.github.com/${NC}"
    echo ""
    read -p "Enter GitHub Personal Access Token (or press Enter to skip): " GITHUB_TOKEN
    if [ -z "$GITHUB_TOKEN" ]; then
        log_warning "Skipping GitHub secrets setup. You'll need to set them manually."
        SECRETS_SKIPPED=true
    fi
fi

echo ""

# Create Azure Service Principal
log_info "Creating Azure Service Principal for GitHub Actions..."

SP_NAME="github-actions-finelle-ui-$(date +%Y%m%d-%H%M%S)"
echo -e "   ${NC}Service Principal Name: $SP_NAME"

SP_OUTPUT=$(az ad sp create-for-rbac \
    --name "$SP_NAME" \
    --role "Contributor" \
    --scopes "/subscriptions/$SUBSCRIPTION_ID" \
    --json-auth)

CLIENT_ID=$(echo "$SP_OUTPUT" | jq -r '.clientId')
CLIENT_SECRET=$(echo "$SP_OUTPUT" | jq -r '.clientSecret')
SP_SUBSCRIPTION_ID=$(echo "$SP_OUTPUT" | jq -r '.subscriptionId')
SP_TENANT_ID=$(echo "$SP_OUTPUT" | jq -r '.tenantId')

log_success "Service Principal created successfully"
echo -e "   ${NC}Client ID: $CLIENT_ID"
echo -e "   ${NC}Tenant ID: $SP_TENANT_ID"

echo ""

# Set GitHub Secrets
log_info "Setting up GitHub repository secrets..."

SECRETS_SET=0

if [ "$SECRETS_SKIPPED" = "true" ]; then
    log_warning "GitHub secrets setup was skipped due to authentication issues."
elif [ -n "$GITHUB_TOKEN" ]; then
    log_info "Using Personal Access Token for secret management"
    export GITHUB_TOKEN
    
    secrets=("AZURE_CLIENT_ID:$CLIENT_ID" "AZURE_TENANT_ID:$SP_TENANT_ID" "AZURE_SUBSCRIPTION_ID:$SP_SUBSCRIPTION_ID")
    
    for secret in "${secrets[@]}"; do
        SECRET_NAME="${secret%%:*}"
        SECRET_VALUE="${secret##*:}"
        
        if gh secret set "$SECRET_NAME" --body "$SECRET_VALUE" --repo "$REPO_OWNER/$REPO_NAME" 2>/dev/null; then
            log_success "Set secret: $SECRET_NAME"
            ((SECRETS_SET++))
        else
            log_warning "Failed to set secret: $SECRET_NAME"
        fi
    done
elif command -v gh &> /dev/null && gh auth status &> /dev/null; then
    log_info "Using GitHub CLI authentication for secret management"
    
    # Check if we can access the repository
    if ! gh repo view "$REPO_OWNER/$REPO_NAME" --json name >/dev/null 2>&1; then
        log_warning "Cannot access repository $REPO_OWNER/$REPO_NAME. Please check permissions."
        SECRETS_SKIPPED=true
    else
        secrets=("AZURE_CLIENT_ID:$CLIENT_ID" "AZURE_TENANT_ID:$SP_TENANT_ID" "AZURE_SUBSCRIPTION_ID:$SP_SUBSCRIPTION_ID")
        
        for secret in "${secrets[@]}"; do
            SECRET_NAME="${secret%%:*}"
            SECRET_VALUE="${secret##*:}"
            
            if gh secret set "$SECRET_NAME" --body "$SECRET_VALUE" --repo "$REPO_OWNER/$REPO_NAME" 2>/dev/null; then
                log_success "Set secret: $SECRET_NAME"
                ((SECRETS_SET++))
            else
                log_warning "Failed to set secret: $SECRET_NAME"
            fi
        done
    fi
else
    log_warning "GitHub CLI not available and no token provided"
    SECRETS_SKIPPED=true
fi

echo ""

if [ $SECRETS_SET -eq 3 ]; then
    log_success "All GitHub secrets configured successfully!"
elif [ "$SECRETS_SKIPPED" = "true" ]; then
    log_warning "GitHub secrets setup was skipped due to authentication issues."
    echo ""
    echo -e "${CYAN}🔑 Manual Setup Required:${NC}"
    echo -e "${CYAN}Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions${NC}"
    echo ""
    echo -e "${YELLOW}AZURE_CLIENT_ID:${NC} $CLIENT_ID"
    echo -e "${YELLOW}AZURE_TENANT_ID:${NC} $SP_TENANT_ID"
    echo -e "${YELLOW}AZURE_SUBSCRIPTION_ID:${NC} $SP_SUBSCRIPTION_ID"
else
    log_warning "Some secrets failed to set automatically. Manual setup may be required:"
    echo ""
    echo -e "${CYAN}Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions${NC}"
    echo ""
    echo -e "${YELLOW}AZURE_CLIENT_ID:${NC} $CLIENT_ID"
    echo -e "${YELLOW}AZURE_TENANT_ID:${NC} $SP_TENANT_ID"
    echo -e "${YELLOW}AZURE_SUBSCRIPTION_ID:${NC} $SP_SUBSCRIPTION_ID"
fi

echo ""

# Trigger GitHub Actions Workflow
log_info "Triggering initial GitHub Actions workflow..."

if [ $SECRETS_SET -eq 3 ]; then
    if command -v gh &> /dev/null && gh auth status &> /dev/null; then
        log_info "Triggering bootstrap workflow with all secrets configured..."
        
        if gh workflow run "deploy.yml" --repo "$REPO_OWNER/$REPO_NAME" --field bootstrap=true 2>/dev/null; then
            log_success "GitHub Actions workflow triggered successfully!"
            echo ""
            echo -e "${CYAN}🌐 Monitor the workflow progress at:${NC}"
            echo -e "   ${NC}https://github.com/$REPO_OWNER/$REPO_NAME/actions"
            
            # Wait a moment and check if workflow started
            sleep 3
            if command -v jq &> /dev/null; then
                LATEST_RUN=$(gh run list --repo "$REPO_OWNER/$REPO_NAME" --limit 1 --json status,workflowName 2>/dev/null | jq -r '.[0].status // "unknown"')
                if [ "$LATEST_RUN" != "unknown" ]; then
                    echo -e "   ${NC}Latest workflow status: $LATEST_RUN"
                fi
            fi
        else
            log_warning "Failed to trigger workflow automatically"
        fi
    else
        log_warning "Cannot trigger workflow automatically. Please run manually."
    fi
else
    log_warning "Secrets not fully configured. Skipping automatic workflow trigger."
    echo ""
    echo -e "${CYAN}🔧 After setting up secrets manually, trigger the workflow:${NC}"
    echo -e "   ${NC}1. Go to: https://github.com/$REPO_OWNER/$REPO_NAME/actions"
    echo -e "   ${NC}2. Click 'Deploy Finelle UI to Azure Container Apps'"
    echo -e "   ${NC}3. Click 'Run workflow'"
    echo -e "   ${NC}4. Check 'Run initial bootstrap' checkbox"
    echo -e "   ${NC}5. Click 'Run workflow'"
fi

echo ""

# Create local environment file for reference
log_info "Creating local reference files..."

cat > .env.github-actions << EOF
# Azure Service Principal Details for GitHub Actions
# Created: $(date)

AZURE_CLIENT_ID=$CLIENT_ID
AZURE_TENANT_ID=$SP_TENANT_ID
AZURE_SUBSCRIPTION_ID=$SP_SUBSCRIPTION_ID
AZURE_ENV_NAME=$AZURE_ENV_NAME

# GitHub Repository
GITHUB_REPO=$REPO_OWNER/$REPO_NAME

# Service Principal Name (for reference)
SERVICE_PRINCIPAL_NAME=$SP_NAME
EOF

log_success "Created .env.github-actions for reference"

# Add to .gitignore if not already there
if [ -f ".gitignore" ]; then
    if ! grep -q "\.env\.github-actions" .gitignore; then
        echo "" >> .gitignore
        echo "# GitHub Actions bootstrap reference" >> .gitignore
        echo ".env.github-actions" >> .gitignore
        log_success "Added .env.github-actions to .gitignore"
    fi
fi

echo ""

# Summary
echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════╗
║                    🎉 BOOTSTRAP COMPLETE                 ║
╚══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
log_success "Service Principal Created: $SP_NAME"
log_success "GitHub Secrets Configured: $SECRETS_SET/3"
log_success "Reference Files Created"

if [ $SECRETS_SET -eq 3 ]; then
    log_success "GitHub Actions Ready"
else
    log_warning "Manual Secret Setup Required"
fi

echo ""
echo -e "${CYAN}🚀 Next Steps:${NC}"
echo -e "   ${NC}1. Monitor workflow: https://github.com/$REPO_OWNER/$REPO_NAME/actions"
echo -e "   ${NC}2. Wait for bootstrap deployment to complete"
echo -e "   ${NC}3. Test automatic deployments by pushing to main branch"
echo -e "   ${NC}4. Verify Application Insights telemetry in deployed app"

echo ""
echo -e "${CYAN}🔗 Useful Links:${NC}"
echo -e "   ${NC}• GitHub Actions: https://github.com/$REPO_OWNER/$REPO_NAME/actions"
echo -e "   ${NC}• Repository Secrets: https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions"
echo -e "   ${NC}• Azure Portal: https://portal.azure.com"

echo ""
log_warning "Tip: Keep the .env.github-actions file for reference, but never commit it!"
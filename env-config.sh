#!/bin/sh
# This script injects runtime environment variables into the React app and nginx
# It runs automatically via nginx's /docker-entrypoint.d/ mechanism

echo "========================================="
echo "🚀 Runtime Environment Configuration"
echo "========================================="
echo "VITE_APPINSIGHTS_CONNECTION_STRING length: ${#VITE_APPINSIGHTS_CONNECTION_STRING}"
echo "VITE_BACKEND_URL: ${VITE_BACKEND_URL}"
echo "========================================="

# Create runtime config file for JavaScript
cat > /usr/share/nginx/html/env-config.js << EOF
window._env_ = {
  VITE_APPINSIGHTS_CONNECTION_STRING: "${VITE_APPINSIGHTS_CONNECTION_STRING}",
  VITE_BACKEND_URL: "${VITE_BACKEND_URL}"
};
EOF

echo "✅ Runtime environment configuration created at /usr/share/nginx/html/env-config.js"
echo "File contents:"
cat /usr/share/nginx/html/env-config.js

# Process nginx.conf template to inject BACKEND_URL
echo ""
echo "📡 Backend proxy configuration:"
echo "BACKEND_URL (for nginx): ${VITE_BACKEND_URL}"

# Use envsubst to replace ${BACKEND_URL} in nginx.conf
# First, backup the original if not already backed up
if [ ! -f /etc/nginx/nginx.conf.template ]; then
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.template
fi

# Export BACKEND_URL for envsubst
export BACKEND_URL="${VITE_BACKEND_URL}"

# Apply envsubst to inject the variable
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

echo "✅ nginx.conf updated with BACKEND_URL=${BACKEND_URL}"
echo "========================================="

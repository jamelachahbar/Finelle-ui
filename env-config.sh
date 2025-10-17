#!/bin/sh
# This script injects runtime environment variables into the React app
# It runs automatically via nginx's /docker-entrypoint.d/ mechanism

echo "========================================="
echo "🚀 Runtime Environment Configuration"
echo "========================================="
echo "VITE_APPINSIGHTS_CONNECTION_STRING length: ${#VITE_APPINSIGHTS_CONNECTION_STRING}"
echo "VITE_BACKEND_URL: ${VITE_BACKEND_URL}"
echo "========================================="

# Create runtime config file
cat > /usr/share/nginx/html/env-config.js << EOF
window._env_ = {
  VITE_APPINSIGHTS_CONNECTION_STRING: "${VITE_APPINSIGHTS_CONNECTION_STRING}",
  VITE_BACKEND_URL: "${VITE_BACKEND_URL}"
};
EOF

echo "✅ Runtime environment configuration created at /usr/share/nginx/html/env-config.js"
echo "File contents:"
cat /usr/share/nginx/html/env-config.js
echo "========================================="

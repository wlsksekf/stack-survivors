#!/bin/bash
# Nginx & Let's Encrypt Initial SSL Setup Script

DOMAIN="api.stack-survivors.site"
EMAIL="admin@stack-survivors.site" # Change to real email

echo "### 1. Setting up temporary Nginx for initial Let's Encrypt challenge ###"
cp nginx/conf.d/init.conf.template nginx/conf.d/default.conf

echo "### 2. Starting Nginx container... ###"
docker-compose up -d nginx

echo "### 3. Requesting initial Let's Encrypt certificate... ###"
docker-compose run --rm certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email $EMAIL --agree-tos --no-eff-email

if [ $? -eq 0 ]; then
    echo "### 4. Certificate issued successfully. Switching to production SSL Nginx configuration... ###"
    cp nginx/conf.d/default.conf.template nginx/conf.d/default.conf
    
    echo "### 5. Reloading Nginx to apply SSL... ###"
    docker-compose exec nginx nginx -s reload
    
    echo "### 6. Starting auto-renewing Certbot daemon... ###"
    docker-compose up -d certbot
    
    echo "### Setup completed successfully! ###"
else
    echo "### Error: Certificate issuance failed. Check the logs above. ###"
fi

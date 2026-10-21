#!/bin/bash
set -e

echo "=== Configurando Nginx Reverse Proxy ==="

cat << 'EOF' > /tmp/gtel_nginx.conf
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name gtel-talento.northcentralus.cloudapp.azure.com;

    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
        proxy_connect_timeout 10s;
    }
}
EOF

sudo cp /tmp/gtel_nginx.conf /etc/nginx/sites-available/default
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "=== Solicitando Certificado SSL Let's Encrypt ==="
sudo certbot --nginx -d gtel-talento.northcentralus.cloudapp.azure.com --non-interactive --agree-tos -m U22222615@utp.edu.pe --redirect

echo "=== Certificado SSL instalado y configurado correctamente ==="

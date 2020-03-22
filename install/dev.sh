#!/bin/bash

# Turn on bold green
G='\e[1;32m'
# Reset colour
R='\e[0m'

# Install node
echo -e "${G}Installing NodeJS 12...${R}"
curl -sL https://deb.nodesource.com/setup_13.x | sudo -E bash -
apt-get -qq install nodejs

# Install package
echo -e "${G}Installing grunt and npm modules...${R}"
cd ../development
npm install

# Change supervisor info
sed -i 's/environment=VERBOSE=0/environment=VERBOSE=1/' /etc/supervisor/supervisord.conf

# Change nginx info
sed -i 's/csr.memologin.com/mecsr.local/g' /etc/nginx/sites-available/*.conf
sed -i 's/csr.memologin.com/local/g' /etc/nginx/ssl_params

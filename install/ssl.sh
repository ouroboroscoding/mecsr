#!/bin/bash

apt-get -qq install software-properties-common
add-apt-repository ppa:certbot/certbot
apt-get -qq update
apt-get -qq install python-certbot-nginx
apt-get -qq install python-pip
mkdir -p /root/venvs/certbot
virtualenv -p /usr/bin/python3 /root/venvs/certbot
/root/venvs/certbot/bin/pip install certbot_dns_route53
/root/venvs/certbot/bin/certbot certonly --dns-route53 --dns-route53-propagation-seconds 30 -d mecsr.com -d *.mecsr.com --server https://acme-v02.api.letsencrypt.org/directory

#/root/venvs/certbot/bin/certbot renew

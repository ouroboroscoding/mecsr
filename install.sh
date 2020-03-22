#!/bin/bash

# Turn on bold green
G='\e[1;32m'
# Reset colour
R='\e[0m'

# Get the current path of the install script and make sure /mecsr points to it if
#	it doesn't already
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DIR="$( dirname "${DIR}" )"
if [ ! -d "/mecsr" ];  then
	ln -sf ${DIR} /mecsr
fi

# Install log
LOGFILE=/mecsr/install/install.log

# Clear the install log
echo '' > $LOGFILE

# Add the universe packages
echo -e "${G}Adding repositories to Ubuntu...${R}"
# Universe
sed -i 's/ubuntu bionic main/ubuntu bionic main universe/' /etc/apt/sources.list
sed -i 's/ubuntu bionic-security main/ubuntu bionic-security main universe/' /etc/apt/sources.list
sed -i 's/ubuntu bionic-updates main/ubuntu bionic-updates main universe/' /etc/apt/sources.list

# update apt
echo -e "${G}Updating apt...${R}"
apt-get -qq update &>> $LOGFILE

# Redis
echo -e "${G}Installing Redis...${R}"
apt-get -qq install redis &>> $LOGFILE

# Install python virtalenv
echo -e "${G}Installing PIP and Virtualenv for Python3...${R}"
apt-get -qq install python3-pip &>> $LOGFILE
pip3 -q install virtualenv &>> $LOGFILE
mkdir -p /root/venvs/mecsr
virtualenv -p /usr/bin/python3 /root/venvs/mecsr &>> $LOGFILE
/root/venvs/mecsr/bin/pip install -r /mecsr/services/requirements.txt &>> $LOGFILE

# Install nginx
echo -e "${G}Installing NGINX...${R}"
apt-get -qq install nginx &>> $LOGFILE

# Install supervisor
echo -e "${G}Installing Supervisor...${R}"
apt-get -qq install supervisor &>> $LOGFILE

# Make folders and copy etc files
echo -e "${G}Making folders, copying server config files, and creating aliases...${R}"
# log directory
mkdir -p /var/log/mecsr
# copy etc files
cp -R /mecsr/install/devops/* /
# Aliases
echo "alias lf='ls -aCF'" >> ~/.bashrc
echo "alias venv='source /root/venvs/mecsr/bin/activate; cd /mecsr/services'" >> ~/.bashrc

# Restart services
echo -e "${G}Restarting services...${R}"
service nginx restart

# Installing Microservices
echo -e "${G}Installing Microservices...${R}"
cd /mecsr/services
#/root/venvs/mecsr/bin/python install.py

echo -e "${G}MeCSR installed successfully${R}"
echo -e ""
echo -e "If you are on a development machine, run \"./install/dev.sh\" now"
echo -e ""

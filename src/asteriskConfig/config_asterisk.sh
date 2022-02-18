#!/bin/bash -xe
IP=$( jq -r '.IP' /etc/config.json )
OUTBOUND_HOSTNAME=$( jq -r '.OutboundHostName' /etc/config.json )
PHONE_NUMBER=$( jq -r '.PhoneNumber' /etc/config.json )

sed -i "s/IP_ADDRESS/$IP/g" /etc/asterisk/pjsip.conf
sed -i "s/OUTBOUND_HOST_NAME/$OUTBOUND_HOSTNAME/g" /etc/asterisk/pjsip.conf
sed -i "s/PHONE_NUMBER/$PHONE_NUMBER/g" /etc/asterisk/pjsip.conf
sed -i "s/PHONE_NUMBER/$PHONE_NUMBER/g" /etc/asterisk/extensions.conf

groupadd asterisk
useradd -r -d /var/lib/asterisk -g asterisk asterisk
usermod -aG audio,dialout asterisk
chown -R asterisk.asterisk /etc/asterisk
chown -R asterisk.asterisk /var/{lib,log,spool}/asterisk

systemctl start asterisk
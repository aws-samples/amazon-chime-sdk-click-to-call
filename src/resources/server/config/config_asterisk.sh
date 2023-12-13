#!/bin/bash -xe

PUBLIC_IP=$( jq -r '.IP' /etc/config.json )
VOICE_CONNECTOR=$( jq -r '.VOICE_CONNECTOR' /etc/config.json )
PHONE_NUMBER=$( jq -r '.PHONE_NUMBER' /etc/config.json )
STACK_ID=$( jq -r '.STACK_ID' /etc/config.json )

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/tmp/amazon-cloudwatch-agent.json


sed -i "s/PUBLIC_IP/$PUBLIC_IP/g" /etc/asterisk/pjsip.conf
sed -i "s/VOICE_CONNECTOR/${VOICE_CONNECTOR}/g" /etc/asterisk/pjsip.conf
sed -i "s/PHONE_NUMBER/$PHONE_NUMBER/g" /etc/asterisk/extensions.conf
sed -i "s/PHONE_NUMBER/$PHONE_NUMBER/g" /etc/asterisk/pjsip.conf
sed -i "s/STACK_ID/$STACK_ID/g" /etc/asterisk/pjsip.conf 

echo "VOICE_CONNECTOR: ${VOICE_CONNECTOR}"
echo "PHONE_NUMBER: ${PHONE_NUMBER}"
echo "STACK_ID: ${STACK_ID}"


# aws chime put-voice-connector-origination --voice-connector-id ${VOICE_CONNECTOR} --origination '{"Routes": [{"Host": "'${PUBLIC_IP}'","Port": 5060,"Protocol": "UDP","Priority": 1,"Weight": 1}],"Disabled": false}'
# aws chime put-voice-connector-termination --voice-connector-id ${VOICE_CONNECTOR} --termination '{"CpsLimit": 1, "CallingRegions": ["US"], "CidrAllowedList": ["'${PUBLIC_IP}'/32"], "Disabled": false}'


usermod -aG audio,dialout asterisk
chown -R asterisk.asterisk /etc/asterisk
chown -R asterisk.asterisk /var/{lib,log,spool}/asterisk

echo '0 * * * * /sbin/asterisk -rx "core reload"' > /etc/asterisk/crontab.txt 
crontab /etc/asterisk/crontab.txt

systemctl restart asterisk
/sbin/asterisk -rx "core reload"

cd /home/ubuntu/site
chown ubuntu:ubuntu . -R
yarn && yarn run build
systemctl enable nginx
systemctl restart nginx
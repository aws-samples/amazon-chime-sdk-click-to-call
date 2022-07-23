DOMAIN_REGEX="^([a-zA-Z0-9](([a-zA-Z0-9-]){0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
while true; do
    read -p "Deploy with Asterisk [Y/N]: " Asterisk
    case $Asterisk in
        [Yy]* ) AsteriskDeploy=y; break;;
        [Nn]* ) AsteriskDeploy=n; break;;
        * ) echo "Please answer Y or N.";;
    esac
done
while true; do
  read -p "Allowed Domain: " AllowedDomain
  if [[ $AllowedDomain =~ $DOMAIN_REGEX ]] || [ -z $AllowedDomain]; then
    break;
  fi
done
echo "{\"AsteriskDeploy\":\"$AsteriskDeploy\", \"AllowedDomain\":\"$AllowedDomain\"}" > cdk.context.json

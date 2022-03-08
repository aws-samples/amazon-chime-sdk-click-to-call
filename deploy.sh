 #!/bin/bash
DOMAIN="^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$"
if ! [ -x "$(command -v node)" ]; then
  echo 'Error: node is not installed.' >&2
  exit 1
fi
NODEVER="$(node --version)"
REQNODE="v12.0.0"
if ! [ "$(printf '%s\n' "$REQNODE" "$NODEVER" | sort -V | head -n1)" = "$REQNODE" ]; then 
    echo 'node must be version 12+'
    exit 1
fi
if ! [ -x "$(command -v yarn)" ]; then
  echo 'Error: yarn is not installed.' >&2
  exit 1
fi
echo ""
echo "Installing Packages"
echo ""
yarn
echo ""
echo "Building CDK"
echo ""
yarn run build
echo ""
echo "Bootstrapping CDK"
echo ""
yarn cdk bootstrap
while true; do
    read -p "Deploy with Asterisk [Y/N]: " Asterisk
    case $Asterisk in
        [Yy]* ) AsteriskDeploy=y; break;;
        [Nn]* ) AsteriskDeploy=n; break;;
        * ) echo "Please answer Y or N.";;
    esac
done
while [[ !($AllowedDomain =~ $DOMAIN) ]]; do
  read -p "Allowed Domain: " AllowedDomain
done
echo ""
echo "Deploying CDK"
echo ""
yarn cdk deploy --context AsteriskDeploy=$AsteriskDeploy --context AllowedDomain=$AllowedDomain -O site/src/cdk-outputs.json
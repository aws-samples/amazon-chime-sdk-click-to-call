 #!/bin/bash
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
echo ""
echo "Deploying CDK"
echo ""
yarn cdk deploy -O site/src/cdk-outputs.json


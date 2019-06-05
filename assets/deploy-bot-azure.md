# Deploy Bot to Azure

This guide will show you how to deploy and configure your bot to an Azure Web as a container.

## Get Started

> This guide uses the Azure CLI and bash scripting conventions. If you do not have these on your environment, you can use the [Azure Cloud Shell](http://shell.azure.com).

### 0. Choose Azure Names

We will use the following variable names in this guide. Choose unique names and paste the assignments into the Azure Cloud Shell so that they can be referenced later.

```bash
RG=my-resource-group
ACR=myacr
WEB_PLAN=my-web-plan
BOT=my-bot
LUIS=my-luis
MAPS=my-maps
DARK_SKY_KEY=<copy from .env>
LUIS_APP_ID_WEATHER=<copy from .env>
PW=$(cat /proc/sys/kernel/random/uuid)
```

### 1. Create a Resource Group

```bash
az group create -n $RG -l westus
```

### 2. Create Azure Container Registry

```bash
az acr create -g $RG -n $ACR --sku Standard --admin-enabled
```

### 3. Build Container Image

> These commands must be run from the directory containing `package.json` of the bot you want to build

```bash
npm run build
az acr build -g $RG -r $ACR -t my-weather-bot:latest .
```

> `my-weather-bot` is the name of your container image. Choose any name you like, but be consistent in the following commands

### 4. Create Linux Web App

```bash
az appservice plan create -g $RG -n $WEB_PLAN --is-linux
az webapp create -g $RESOURCE_GROUP -p $PLAN -n $WEB --runtime 'node|10.14'
```

### 5. Create Bot Registration

```bash
MSA=$(az ad app create --display-name $BOT --password $PW --available-to-other-tenants --query appId -o tsv)
az bot create --appid $MSA -k registration -n $BOT -p $PW -g $RG -e https://$BOT.azurewebsites.net
```

### 6. Create Supporting Services

> Add a `--yes` flag to the first command to automatically accept the Cognitive Services license agreement

> Add a `--accept-tos` flag to the second command to automatically accept the Azure Maps terms of service.

```bash
# Create LUIS subscription key
az cognitiveservices account create --g $RG -n $LUIS -l westus --kind LUIS --sku S0

# Create Azure Maps
az maps account create -g $RG -n $MAPS
```

### 7. Configure Web App

```bash
ACR_KEY=$(az acr credential show -g $RG -n $ACR --query passwords[0].value -o tsv)
LUIS_LOCATION=$(az cognitiveservices account show -g $RG -n $LUIS -o tsv --query location)
LUIS_KEY=$(az cognitiveservices account keys list -g $RG -n $LUIS -o tsv --query key1)
MAP_KEY=$(az maps account keys list -g $RG -n $MAPS -o tsv --query primaryKey)
DIRECT_LINE_KEY=$(az bot directline show -rg $RG -n $BOT --with-secrets --query properties.properties.sites[0].key -o tsv)

az webapp config appsettings set -g $RG -n $BOT --settings LUIS_SUBSCRIPTION_KEY=$LUIS_KEY LUIS_SUBSCRIPTION_REGION=$LUIS_LOCATION LUIS_APP_ID_WEATHER=$LUIS_APP_ID MSA_APP_ID=$MSA MSA_PASSWORD=$PW MAP_KEY=$MAP_KEY DARK_SKY_KEY=$DARK_SKY_key DIRECT_LINE_KEY=$DIRECT_LINE_KEY

az webapp config container set g $RG --name $BOT --docker-custom-image-name $ACR.azurecr.io/my-weather-bot:latest --docker-registry-server-password $ACR_KEY --docker-registry-server-url https://$ACR.azurecr.io --docker-registry-server-user $ACR
```

You can now chat with your bot at `https://$BOT.azurewebsites.net/`
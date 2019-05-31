source .params

LUIS_APP_ID_WEATHER=$1
DARK_SKY_KEY=$2

# CREATE RESOURCE GROUP
az group create \
  --location $LOCATION \
  --name $RESOURCE_GROUP

# CREATE CONTAINER REGISTRY
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR \
  --sku Standard \
  --admin-enabled true

# CREATE LUIS
az cognitiveservices account create \
  --resource-group $RESOURCE_GROUP \
  --name $LUIS \
  --location $LOCATION \
  --kind LUIS \
  --sku S0 \
  --yes

# CREATE BOT
#   - MSA_APP_ID STEP REQUIRES MANUAL LOGIN
MSA_PASSWORD=$(openssl rand -hex 16)
MSA_APP_ID=$(az bot create \
  --resource-group $RESOURCE_GROUP \
  --kind registration \
  --name $BOT \
  --endpoint https://$WEBAPP.azurewebsites.net/api/messages \
  --password $MSA_PASSWORD \
  --output tsv \
  --query properties.msaAppId)

# CONFIGS
ACR_KEY=$(az acr credential show \
  --resource-group $RESOURCE_GROUP \
  --name $ACR \
  --query passwords[0].value \
  --output tsv)
LUIS_LOCATION=$(az cognitiveservices account show \
  --resource-group $RESOURCE_GROUP \
  --name $LUIS \
  --output tsv \
  --query location)
LUIS_KEY=$(az cognitiveservices account keys list \
  --resource-group $RESOURCE_GROUP \
  --name $LUIS \
  --output tsv \
  --query key1)
STORAGE_KEY=$(az storage account keys list \
  --account-name $STORAGE \
  --output tsv \
  --query [0].value)
MAPS_KEY=$(az maps account keys list \
--resource-group $RESOURCE_GROUP \
--name $MAPS \
--output tsv \
--query primaryKey)

# PUSH CONTAINER IMAGE
npm install
az acr build \
  --resource-group $RESOURCE_GROUP \
  --registry $ACR \
  --image $IMAGE_NAME:{{.Run.ID}} \
  --image $IMAGE_NAME:latest \
  .

# CREATE APP SERVICE PLAN
az appservice plan create \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP_PLAN \
  --is-linux

# CREATE WEB APP
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP \
  --plan $WEBAPP_PLAN \
  --runtime 'node|8.11'
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP \
  --settings \
    STORAGE_ACCOUNT=$STORAGE \
    STORAGE_KEY=$STORAGE_KEY \
    LUIS_SUBSCRIPTION_KEY=$LUIS_KEY \
    LUIS_SUBSCRIPTION_REGION=$LUIS_LOCATION \
    LUIS_APP_WEATHER_ID=$LUIS_APP_ID_WEATHER \
    MAP_KEY=$MAPS_KEY \
    DARK_SKY_KEY=$DARK_SKY_KEY \
    MSA_APP_ID=$MSA_APP_ID \
    MSA_PASSWORD=$MSA_PASSWORD
az webapp config container set \
  --resource-group $RESOURCE_GROUP \
  --name $WEBAPP \
  --docker-custom-image-name $ACR.azurecr.io/$IMAGE_NAME:latest \
  --docker-registry-server-password $ACR_KEY \
  --docker-registry-server-url https://$ACR.azurecr.io \
  --docker-registry-server-user $ACR
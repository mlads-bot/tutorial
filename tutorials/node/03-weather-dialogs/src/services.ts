// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { BotFrameworkAdapter } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import { BlobStorage } from 'botbuilder-azure';
import DarkSky = require('dark-sky');

import { AzureMap } from './map';
import {
  BLOB_SETTINGS,
  BOT_SETTINGS,
  DARK_SKY_SETTINGS,
  LUIS_SETTINGS,
  MAP_SETTINGS } from './settings';

export function createBlobStorage() {
  const { account, key, containers: { state } } = BLOB_SETTINGS;
  return new BlobStorage({
    storageAccountOrConnectionString: account,
    storageAccessKey: key,
    containerName: state,
  });
}

export function createWeatherRecognizer() {
  const { key, region, apps: { weatherAppId} } = LUIS_SETTINGS;
  return new LuisRecognizer({
    applicationId: weatherAppId,
    endpointKey: key,
    endpoint: `https://${region}.api.cognitive.microsoft.com`,
  });
}

export function createAzureMap() {
  const { key } = MAP_SETTINGS;
  return new AzureMap(key);
}

export function createDarkSky() {
  const { key } = DARK_SKY_SETTINGS;
  return new DarkSky(key);
}

export function createBotAdapter() {
  const { appId, appPassword } = BOT_SETTINGS;
  const adapter = new BotFrameworkAdapter({ appId, appPassword });
  adapter.onTurnError = async (context, error) => {
    console.error('[ Unhandled Error ]', error);
    await context.sendActivity(`Oops, something went wrong! Check your bot's log.`);
  };
  return adapter;
}

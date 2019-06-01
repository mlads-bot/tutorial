// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { BotFrameworkAdapter, MemoryStorage } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';

import { LUIS_SETTINGS } from './settings';

export function createStorage() {
  // TODO: in production replace with `BlobStorage` from package `botbuilder-azure`
  return new MemoryStorage();
}

export function createWeatherRecognizer() {
  const { key, region, apps: { weatherAppId} } = LUIS_SETTINGS;
  return new LuisRecognizer({
    applicationId: weatherAppId,
    endpointKey: key,
    endpoint: `https://${region}.api.cognitive.microsoft.com`,
  });
}

export function createBotAdapter() {
  // TODO: in production pass MSA to the adapter
  const adapter = new BotFrameworkAdapter();
  adapter.onTurnError = async (context, error) => {
    console.error('[ Unhandled Error ]', error);
    await context.sendActivity(`Oops, something went wrong! Check your bot's log.`);
  };
  return adapter;
}

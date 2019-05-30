// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export const PORT = env('PORT', '3978');

export const BLOB_SETTINGS = {
  account: env('STORAGE_ACCOUNT'),
  key: env('STORAGE_KEY'),
  containers: {
    state: 'botstate',
  },
};

export const LUIS_SETTINGS = {
  key: env('LUIS_SUBSCRIPTION_KEY'),
  region: env('LUIS_SUBSCRIPTION_REGION'),
  apps: {
    weatherAppId: env('LUIS_APP_WEATHER_ID'),
  },
};

export const MAP_SETTINGS = {
  key: env('MAP_KEY'),
};

export const DARK_SKY_SETTINGS = {
  key: env('DARK_SKY_KEY'),
};

export const BOT_SETTINGS = {
  appId: env('MSA_APP_ID'),
  appPassword: env('MSA_PASSWORD'),
  directLineKey: env('DIRECT_LINE_KEY'),
};

export function env(name: string, defaultValue?: string) {
  if (process.env.hasOwnProperty(name)) {
    return process.env[name];
  } else if (defaultValue !== undefined) {
    return defaultValue;
  } else {
    throw new Error(`Cannot find environment variable '${name}'`);
  }
}

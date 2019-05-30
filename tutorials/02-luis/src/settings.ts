// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export const PORT = env('PORT', '3978');

export const LUIS_SETTINGS = {
    key: env('LUIS_SUBSCRIPTION_KEY'),
    region: env('LUIS_SUBSCRIPTION_REGION'),
    apps: {
        weatherAppId: env('LUIS_APP_WEATHER_ID'),
    },
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

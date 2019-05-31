// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, Middleware, TurnContext } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';

import { LUIS_SETTINGS } from './settings';

export class WeatherBot {
  private luis: LuisRecognizer;

  constructor() {
    const {
      region,
      key: endpointKey,
      apps: { weatherAppId: applicationId },
    } = LUIS_SETTINGS;
    const endpoint = `https://${region}.api.cognitive.microsoft.com`;
    console.log(LUIS_SETTINGS);
    this.luis = new LuisRecognizer({ applicationId, endpointKey, endpoint });
  }

  async onTurn(context: TurnContext): Promise<void> {
    const { type } = context.activity;
    switch (type) {
      case ActivityTypes.ConversationUpdate:
        await this.onConversationUpdate(context);
        break;

      case ActivityTypes.Message:
        await this.onMessage(context);
        break;
    }
  }

  private async onConversationUpdate(context: TurnContext) {
    for (const added of context.activity.membersAdded) {
      const name = added.name || added.id;
      await context.sendActivity(`${name} has joined the chat!`);
    }
  }

  private async onMessage(context: TurnContext) {

    // New code goes here

  }
}

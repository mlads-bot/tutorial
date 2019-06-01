// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, BotStatePropertyAccessor, ConversationState, StatePropertyAccessor, TurnContext, UserState } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import { DialogSet } from 'botbuilder-dialogs';

import { WeatherDialog } from './dialogs/weather-dialog';

export interface WeatherBotOptions {
  user: UserState;
  conversation: ConversationState;
  recognizer: LuisRecognizer;
}

export interface UserInfo {
  name?: string;
  text?: string;
  location?: UserLocation;
}

export interface UserLocation {
  coordinates?: [number, number];
  timezone?: string;
  name?: string;
  type?: string;
}

export class WeatherBot {
  private readonly dialogs: DialogSet;
  private userInfo: StatePropertyAccessor<UserInfo>;

  constructor(options: WeatherBotOptions) {
    const { conversation, recognizer, user } = options;

    this.userInfo = new BotStatePropertyAccessor<UserInfo>(user, `${WeatherBot.name}.user`);
    this.dialogs = new DialogSet(conversation.createProperty(WeatherBot.name))
      .add(new WeatherDialog(recognizer, this.userInfo));
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
    // NEW CODE GOES HERE
  }
}

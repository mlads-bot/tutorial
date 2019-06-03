// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityHandler, BotStatePropertyAccessor, ConversationState, StatePropertyAccessor, UserState } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import { DialogSet } from 'botbuilder-dialogs';
import * as DarkSky from 'dark-sky';

import { WeatherDialog } from './dialogs/weather-dialog';
import { AzureMap } from './map';

export interface WeatherBotOptions {
  user: UserState;
  conversation: ConversationState;
  recognizer: LuisRecognizer;
  darkSky: DarkSky;
  map: AzureMap;
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

export class WeatherBot extends ActivityHandler {
  private readonly dialogs: DialogSet;

  constructor(options: WeatherBotOptions) {
    super();

    const { conversation, recognizer, user, map, darkSky } = options;
    const userInfo = new BotStatePropertyAccessor<UserInfo>(user, `${WeatherBot.name}.user`);

    this.dialogs = new DialogSet(conversation.createProperty(WeatherBot.name))
      .add(new WeatherDialog({ recognizer, userInfo, darkSky, map }));

    this.onMembersAdded(async (context) => {
      for (const added of context.activity.membersAdded) {
        const name = added.name || added.id;
        await context.sendActivity(`${name} has joined the chat!`);
      }
    });

    this.onMessage(async (context) => {
      const dc = await this.dialogs.createContext(context);
      await dc.continueDialog();
      if (!context.responded) {
        await dc.beginDialog(WeatherDialog.dialogId);
      }
    });
  }
}

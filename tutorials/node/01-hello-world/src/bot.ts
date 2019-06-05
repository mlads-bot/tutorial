// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, Middleware, TurnContext } from 'botbuilder';

export class HelloWorldBot {
  async onTurn(context: TurnContext): Promise<void> {

    const { type } = context.activity;
    switch (type) {
      case ActivityTypes.ConversationUpdate:
        for (const added of context.activity.membersAdded) {
          const { name, id } = added;
          await context.sendActivity(`${name || id} has joined the chat!`);
        }
        break;

      case ActivityTypes.Message:
        const { name, id } = context.activity.from;
        const { text } = context.activity;
        await context.sendActivity(`${name || id} said "${text}"`);
        break;
    }

  }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, Middleware, TurnContext } from 'botbuilder';

export class Bot1b implements Middleware {
    async onTurn(context: TurnContext): Promise<void> {
        const type = context.activity.type;

        if (type === ActivityTypes.ConversationUpdate) {
            for (const idx in context.activity.membersAdded) {
                if (context.activity.membersAdded[idx].id !== context.activity.recipient.id) {
                    await context.sendActivity(`Welcome to the weather bot 2.`);
                    await context.sendActivity(`The weather is a typical Redmond weather. Don't believe me, go see for yourself. 😊`);
                    await context.sendActivity(`**FYI**, I'm currently an echo bot and will repeat what you say.`);
                }
            }
        }
        if (type === ActivityTypes.Message) {
            // The channel adds the user name in the 'from' object
            const user = context.activity.from.name;
            const text = context.activity.text;
            await context.sendActivity(`Your name is **${user}**. You said **${text}**`);
        }

    }
}

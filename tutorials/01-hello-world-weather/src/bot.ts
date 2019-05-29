// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityHandler, ActivityTypes, TurnContext } from 'botbuilder';

export class Bot1 extends ActivityHandler {
    constructor() {
        super();

        this.onMembersAdded(async (context: TurnContext, next) => {
            for (const idx in context.activity.membersAdded) {
                if (context.activity.membersAdded[idx].id !== context.activity.recipient.id) {
                    await context.sendActivity(`Welcome to the weather bot.`);
                    await context.sendActivity(`The weather is a typical Redmond weather. Don't believe me, go see for yourself. 😊`);
                    await context.sendActivity(`**FYI**, I'm currently an echo bot and will repeat what you say.`);
                }
            }
            // Ensure that this bot handler is called
            await next();
        });

        this.onMessage(async (context: TurnContext, next) => {
            // The channel adds the user name in the 'from' object
            const user = context.activity.from.name;
            const text = context.activity.text;
            await context.sendActivity(`Your name is **${user}**. You said **${text}**`);

            // Calling next() will ensure that your BotHandler is run
            await next();
        });

    }
}

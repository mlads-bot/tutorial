// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, Middleware, TurnContext } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';

import { LUIS_SETTINGS } from '../settings';
import { DateTime, WeatherEntity, WeatherIntent } from "../types";

export class Bot2 implements Middleware {
    private luis: LuisRecognizer;

    constructor() {
        this.luis = new LuisRecognizer({
            applicationId: LUIS_SETTINGS.apps.weatherAppId,
            endpointKey: LUIS_SETTINGS.key,
            endpoint: `https://${LUIS_SETTINGS.region}.api.cognitive.microsoft.com`,
        }, null, true);
    }

    async onTurn(context: TurnContext): Promise<void> {
        const type = context.activity.type;

        console.log(type);

        if (type === ActivityTypes.ConversationUpdate) {
            for (const idx in context.activity.membersAdded) {
                if (context.activity.membersAdded[idx].id !== context.activity.recipient.id) {
                    await context.sendActivity(`Welcome to the weather bot. Please say hi`);
                    await context.sendActivity(`Or ask me a weather related question and I'll try my best to figure out your intent using **LUIS** - Language Understanding Intelligent Service.`);
                }
            }
        }

        if (type === ActivityTypes.Message) {
            const recognized = await this.luis.recognize(context);
            const intent = LuisRecognizer.topIntent(recognized);
            const { entities } = recognized;
            console.dir(recognized.entities, { depth: 10 });

            await context.sendActivity(`The top scoring intent is: **${intent}**`);
            switch (intent) {
                case WeatherIntent.greeting:
                    return await this.greet(context);

                case WeatherIntent.getForecast:
                    await context.sendActivity('I understand you are asking me about the weather forecast.');
                    break;

                case WeatherIntent.getConditionsFeature:
                    await context.sendActivity('I understand you are asking me about a specific weather condition or feature.');
                    break;

                case WeatherIntent.getConditionsYesNo:
                    await context.sendActivity('I understand you are asking me about weather conditions that require me to give a yes or no response.');
                    break;

                default:
                    return await this.respondUnknown(context, intent);
            }
        }

    }

    private async greet(context: TurnContext) {
        await context.sendActivity('Hello to you too!');
    }

    private async respondUnknown(context: TurnContext, intent: string) {
        await context.sendActivity(`Sorry, I don't understand ${intent}. But I'm still learning.`);
    }
}

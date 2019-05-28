// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { BotFrameworkAdapter, TurnContext } from 'botbuilder';
import * as express from 'express';

import { Bot1 } from './bot';
import { PORT } from './settings';

const adapter = new BotFrameworkAdapter();
adapter.onTurnError = async (context: TurnContext, error) => {
    console.error('[ Unhandled Error ] ', error );
    await context.sendActivity(`Oops, something went wrong! Check your bot's log`);
};

const bot = new Bot1();

express()
    .post('/api/messages', async (req, res, next) => {
        try {
            // Route conversation to main dialog
            await adapter.processActivity(req, res, (context) => bot.run(context));
        } catch ( err ) {
            next(err);
        }
    })
    .listen(PORT, () => console.log(`Listening on ${PORT}. Connect to the bot using the Bot Framework Emulator.`))
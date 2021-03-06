// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { BotFrameworkAdapter } from 'botbuilder';
import * as express from 'express';

import { WeatherBot } from './bot';
import { PORT } from './settings';

const adapter = new BotFrameworkAdapter();
const bot = new WeatherBot();

express()
  .post('/api/messages', async (req, res, next) => {
    try {
      await adapter.processActivity(req, res, (context) => bot.onTurn(context));
    } catch (err) {
      next(err);
    }
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}. Connect to the bot using Bot Framework Emulator.`));

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AutoSaveStateMiddleware, BotFrameworkAdapter, ConversationState, UserState } from 'botbuilder';
import * as express from 'express';

import { WeatherBot } from '../../04-weather-complete/src/bot';
import { createBotAdapter, createStorage, createWeatherRecognizer } from './services';
import { PORT } from './settings';

// BEGIN REPLACE
const adapter: BotFrameworkAdapter = null;
const bot: WeatherBot = null;
// END REPLACE

express()
  .post('/api/messages', async (req, res, next) => {
    try {
      await adapter.processActivity(req, res, (context) => bot.onTurn(context));
    } catch (err) {
      next(err);
    }
  })
  .listen(PORT, () => console.log(`Listening on http://localhost:${PORT}/api/messages. Connect to the bot using Bot Framework Emulator.`));

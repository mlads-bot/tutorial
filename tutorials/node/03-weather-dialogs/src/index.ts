// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AutoSaveStateMiddleware, BotFrameworkAdapter, ConversationState, UserState } from 'botbuilder';
import * as express from 'express';

import { WeatherBot } from './bot';
import { createBotAdapter, createStorage, createWeatherRecognizer } from './services';
import { PORT } from './settings';

// storage holds our user state and conversation state
// in production we would use a cloud storage provider like Azure Blob
// this tutorial will use in-memory storage
const storage = createStorage();

// our bot has "memory" scoped to either a single conversation or for the lifespan of a user
const user = new UserState(storage);
const conversation = new ConversationState(storage);

// we will use the same LUIS model from the previous tutorial
const recognizer = createWeatherRecognizer();

// our adapter is now using a middleware utility to ensure that our state is automatically persisted after each turn
const adapter = createBotAdapter().use(new AutoSaveStateMiddleware(user, conversation));

// we pass state and luis dependencies into our bot (this is an example of Depdendency Injection)
const bot = new WeatherBot({ user, conversation, recognizer });

express()
  .post('/api/messages', async (req, res, next) => {
    try {
      await adapter.processActivity(req, res, (context) => bot.onTurn(context));
    } catch (err) {
      next(err);
    }
  })
  .listen(PORT, () => console.log(`Listening on http://localhost:${PORT}/api/messages. Connect to the bot using Bot Framework Emulator.`));

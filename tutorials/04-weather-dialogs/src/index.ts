// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AutoSaveStateMiddleware, ConversationState, UserState } from 'botbuilder';
import * as express from 'express';

import { WeatherBot } from './bots/weather-bot';
import { BotEventTextMiddleware } from './events';
import { createAzureMap, createBlobStorage, createBotAdapter, createDarkSky, createWeatherRecognizer } from './services';
import { BOT_SETTINGS, PORT } from './settings';
import { generateToken } from './tokens';

const storage = createBlobStorage();
const user = new UserState(storage);
const conversation = new ConversationState(storage);
const weatherRecognizer = createWeatherRecognizer();
const map = createAzureMap();
const darkSky = createDarkSky();

const adapter = createBotAdapter().use(
  new AutoSaveStateMiddleware(user, conversation),
  new BotEventTextMiddleware());
const bot = new WeatherBot({
  user,
  conversation,
  map,
  darkSky,
  recognizer: weatherRecognizer,
});

express()
  .use(express.static(__dirname + '/../public'))
  .post('/api/tokens/generate', (req, res, next) => {
    try {
      const { directLineKey } = BOT_SETTINGS;
      generateToken(directLineKey).pipe(res);
    } catch (err) {
      next(err);
    }
  })
  .post('/api/messages', async (req, res, next) => {
    try {
      await adapter.processActivity(req, res, (context) => bot.onTurn(context));
    } catch (err) {
      next(err);
    }
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}. Connect to the bot using Bot Framework Emulator.`));

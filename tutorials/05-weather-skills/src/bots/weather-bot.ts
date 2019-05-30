// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression';
import { Culture, recognizeDateTime } from '@microsoft/recognizers-text-date-time';
import { ActivityTypes, ConversationState, RecognizerResult, StatePropertyAccessor, TurnContext, UserState } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import DarkSky = require('dark-sky');
import * as moment from 'moment';
import 'moment-timezone';

import { AzureMap } from '../map';
import { DateTime, WeatherEntity, WeatherIntent } from '../types';
import { WeatherContext } from './context';
import { WeatherConditionsBot } from './weather-conditions-bot';
import { WeatherForecastBot } from './weather-forecast-bot';

export interface WeatherBotOptions {
  user: UserState;
  conversation: ConversationState;
  recognizer: LuisRecognizer;
  map: AzureMap;
  darkSky: DarkSky;
}

interface UserInfo {
  location?: UserLocation;
}

interface UserLocation {
  coordinates: [number, number];
  timezone: string;
  name: string;
  type: string;
}

interface LastMessage {
  text: string;
}

export class WeatherBot {

  private userInfo: StatePropertyAccessor<UserInfo>;
  private lastMessage: StatePropertyAccessor<LastMessage>;
  private forecast: WeatherForecastBot;
  private conditions: WeatherConditionsBot;

  constructor(private options: WeatherBotOptions) {
    const { conversation, user } = options;
    this.userInfo = user.createProperty<UserInfo>('userInfo');
    this.lastMessage = conversation.createProperty<LastMessage>('lastMessage');
    this.forecast = new WeatherForecastBot(options.darkSky);
    this.conditions = new WeatherConditionsBot(options.darkSky);
  }

  /// MAIN

  async onTurn(context: TurnContext): Promise<void> {

    switch (context.activity.type) {
      case ActivityTypes.Message:
        await this.onTurnMessage(context);
        break;

      case ActivityTypes.Event:
        await this.onTurnEvent(context);
        break;
    }
  }

  /// MESSAGES

  private async onTurnMessage(context: TurnContext) {
    const { recognizer } = this.options;
    const resp = await recognizer.recognize(context);
    const intent = LuisRecognizer.topIntent(resp);
    const request = await this.getWeatherContext(context, resp);

    if (request.coordinates) {
      switch (intent) {
        case WeatherIntent.getForecast:
          await this.forecast.onTurn(context, request);
          break;

        case WeatherIntent.getConditionsFeature:
          await this.conditions.onTurnGetFeature(context, request, resp);
          break;

        case WeatherIntent.getConditionsYesNo:
          await this.conditions.onTurnGetYesNo(context, request, resp);
          break;

        default:
          await context.sendActivity(`Sorry, I don't understand '${intent}'`);
          break;
      }

      if (!context.responded) {
        await this.forecast.onTurn(context, request);
      }
    } else {
      await this.requestUserLocation(context);
    }
  }

  /// EVENTS

  private async onTurnEvent(context: TurnContext) {
    switch (context.activity.valueType) {
      case 'location':
        await this.onTurnEventLocation(context);
        break;

      case 'reset':
        await this.onTurnEventReset(context);
        break;
    }
  }

  private async onTurnEventReset(context: TurnContext) {
    await this.userInfo.delete(context);
    await this.lastMessage.delete(context);
    await context.sendActivity('State has been reset');
  }

  private async onTurnEventLocation(context: TurnContext) {
    const userInfo = await this.userInfo.get(context, {});
    const [lat, lon] = context.activity.value as [number, number];
    const query = `${lat},${lon}`;
    console.log('searchAddressReverse', query);
    const resp = await this.options.map.searchAddressReverse({ query });
    if (resp.addresses.length) {
      console.log('REVERSE ADDRESS', resp.addresses[0]);
      const [{ address, position }] = resp.addresses;
      const [lat, lon] = position.split(',').map((x) => +x);
      const tz = await this.options.map.getTimezoneByCoordinates([lat, lon]);
      const { freeformAddress } = address;
      userInfo.location = { coordinates: [lat, lon], name: freeformAddress, type: 'TBD', timezone: tz.TimeZones[0].Id };
      const value = await this.lastMessage.get(context);
      await context.sendActivity({ type: ActivityTypes.Event, valueType: 'location.saved', value });
      await this.lastMessage.delete(context);
    } else {
      await context.sendActivity({ type: ActivityTypes.Event, valueType: 'location.notFound' });
    }
  }

  /// HELPERS

  private async getWeatherContext(context: TurnContext, recognized: RecognizerResult): Promise<WeatherContext> {
    const { entities } = recognized;
    const location = await this.getLocation(context, recognized);
    const weather: WeatherContext = {};

    if (location) {
      const { coordinates: [lat, lon], name, timezone } = location;
      weather.locationType = location.type;
      weather.coordinates = [lat, lon];
      weather.requestedLocation = this.getLocationEntity(recognized);
      weather.resolvedLocation = name;

      if (entities.$instance[WeatherEntity.datetime]) {
        const [{ text }] = entities.$instance[WeatherEntity.datetime] as [{ text: string }];
        const [dateTime] = recognizeDateTime(text, Culture.English);
        const [past, future] = dateTime.resolution.values as [DateTime, DateTime];
        const { type, value, start, end, timex } = future || past;
        const date = type === 'time' || type === 'timerange'
          ? parseTime(value || start, timezone)
          : moment.tz(value || start, timezone).toDate();
        const label = new TimexProperty(timex).toNaturalLanguage(moment.tz(timezone).toDate());
        weather.date = date;
        weather.endDate = end
          ? type === 'time' || type === 'timerange'
            ? parseTime(end, timezone)
            : moment.tz(end, timezone).toDate()
          : null;
        weather.dateLabel = label;
        weather.dateType = type;
      }
    }
    return weather;
  }

  private async requestUserLocation(context: TurnContext) {
    const { activity: { text } } = context;
    await context.sendActivity(`Sorry, I don't know where you are located. If your device supports geolocation, I'll try to retrieve it now.`);
    await this.lastMessage.set(context, { text });
    await context.sendActivity({ type: ActivityTypes.Event, valueType: 'location' });
  }

  private getLocationEntity(recognized: RecognizerResult) {
    const { entities } = recognized;
    return entities[WeatherEntity.location]
      || entities[WeatherEntity.city]
      || entities[WeatherEntity.poi]
      || entities[WeatherEntity.state]
      || entities[WeatherEntity.countryRegion];
  }

  private async getLocation(context: TurnContext, recognized: RecognizerResult): Promise<UserLocation> {
    const query = this.getLocationEntity(recognized);
    const userInfo = await this.userInfo.get(context, {});

    if (query) {
      console.log('Query', query);
      const resp = await this.options.map.searchAddress({ query });
      console.log('Results', resp.results.length);
      const top = resp.results.find((x) => {
        return x.type === 'Point Address' || x.entityType === 'Municipality' || x.entityType === 'PostalCodeArea';
      });
      if (top) {
        const { entityType, position: { lat, lon }, address: { freeformAddress } } = top;
        const tz = await this.options.map.getTimezoneByCoordinates([lat, lon]);
        console.log([lat, lon], tz);
        const userLocation: UserLocation = {
          coordinates: [lat, lon],
          name: freeformAddress,
          type: entityType,
          timezone: tz.TimeZones[0].Id,
        };
        console.log('UserLocation', userLocation);
        if (!userInfo.location) {
          userInfo.location = userLocation;
          await this.userInfo.set(context, userInfo);
        }
        return userLocation;
      }
    }

    if (userInfo.location) {
      return userInfo.location;
    }
  }
}

/** Return a date object representing the given time as of today */
function parseTime(time: string, timezone: string) {
  const [hours, minutes, seconds] = time.split(':').map((x) => +x);
  return moment.tz(timezone).set({ hours, minutes, seconds }).toDate();
}

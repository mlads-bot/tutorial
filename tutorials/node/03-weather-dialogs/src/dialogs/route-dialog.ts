// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, RecognizerResult, StatePropertyAccessor, TurnContext } from "botbuilder";
import { LuisRecognizer } from "botbuilder-ai";
import { ComponentDialog, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import DarkSky = require('dark-sky');
import * as moment from 'moment';
import 'moment-timezone';

import { TimexProperty } from "@microsoft/recognizers-text-data-types-timex-expression";
import { Culture, recognizeDateTime } from "@microsoft/recognizers-text-date-time";
import { WeatherContext } from "../bots/context";
import { LastMessage, parseTime, UserInfo, UserLocation, WeatherBotOptions } from "../bots/weather-bot";
import { WeatherConditionsBot } from "../bots/weather-conditions-bot";
import { WeatherForecastBot } from "../bots/weather-forecast-bot";
import { DateTime, WeatherEntity, WeatherIntent } from "../types";
import { OnBoardUserDialog, UserPromptResult } from "./onboard-user-dialog";

enum DialogName {
    main = 'RouteDialog.main',
}

export class RouteDialog extends ComponentDialog {
    static readonly dialogId = RouteDialog.name;
    constructor(
        private options: WeatherBotOptions,
        private userInfo: StatePropertyAccessor<UserInfo>,
        private lastMessage: StatePropertyAccessor<LastMessage>,
        private forecast: WeatherForecastBot,
        private conditions: WeatherConditionsBot) {
        super(RouteDialog.dialogId);

        this.addDialog(new WaterfallDialog(DialogName.main, [
            this.begin.bind(this),
            this.route.bind(this),
        ]));
        this.addDialog(new OnBoardUserDialog(this.userInfo, this.options));
    }

    private async begin(step: WaterfallStepContext) {
        const user = await this.userInfo.get(step.context);
        if (user) {
            const text = step.context.activity.text;
            const result: UserPromptResult = { text };
            return await step.next(result);
        } else {
            return await step.beginDialog(OnBoardUserDialog.dialogId);
        }
    }

    private async route(step: WaterfallStepContext<UserPromptResult>) {
        const context = step.context;
        const { recognizer } = this.options;
        const resp = await recognizer.recognize(context);
        const intent = LuisRecognizer.topIntent(resp);
        const request = await this.getWeatherContext(context, resp);
        const user = await this.userInfo.get(context);

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
        return await step.endDialog();
    }

    private async getWeatherContext(context: TurnContext, recognized: RecognizerResult): Promise<WeatherContext> {
        const { entities } = recognized;
        const location = await this.getLocation(context, recognized);
        const weather: WeatherContext = {};

        console.dir(location, { depth: 10 });
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

    private getLocationEntity(recognized: RecognizerResult) {
        const { entities } = recognized;
        return entities[WeatherEntity.location]
            || entities[WeatherEntity.city]
            || entities[WeatherEntity.poi]
            || entities[WeatherEntity.state]
            || entities[WeatherEntity.countryRegion];
    }
    private async requestUserLocation(context: TurnContext) {
        const { activity: { text } } = context;
        await context.sendActivity(`Sorry, I don't know where you are located. If your device supports geolocation, I'll try to retrieve it now.`);
        await this.lastMessage.set(context, { text });
        await context.sendActivity({ type: ActivityTypes.Event, valueType: 'location' });
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
                if (typeof userInfo.location === 'string') {
                    console.log('Resetting Location...');
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

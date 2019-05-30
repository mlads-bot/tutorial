// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, ConversationState, StatePropertyAccessor, TurnContext, UserState } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import DarkSky = require('dark-sky');
import * as moment from 'moment';
import 'moment-timezone';

import { DialogSet } from 'botbuilder-dialogs';
import { RouteDialog } from '../dialogs/route-dialog';
import { AzureMap } from '../map';
import { WeatherConditionsBot } from './weather-conditions-bot';
import { WeatherForecastBot } from './weather-forecast-bot';

export interface WeatherBotOptions {
    user: UserState;
    conversation: ConversationState;
    recognizer: LuisRecognizer;
    map: AzureMap;
    darkSky: DarkSky;
}

export interface UserInfo {
    name?: string;
    text?: string;
    location?: UserLocation;
}

export interface UserLocation {
    coordinates?: [number, number];
    timezone?: string;
    name?: string;
    type?: string;
}

export interface LastMessage {
    text: string;
}

const WELCOME_TEXT = `
Welcome to the Weather Bot.

I use the [Dark Sky API](https://darksky.net) to help answer weather related questions in your location.

To begin please set your location by sending an event to this bot.

You can set your location in the form **/location:[long, lat]**.

For example: **/location:[42.361145, -71.057083]** to set it to Boston, MA.
`;

export class WeatherBot {
    private readonly dialogs: DialogSet;
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

        this.dialogs = new DialogSet(conversation.createProperty('dialog'));
        this.dialogs.add(new RouteDialog(
            this.options,
            this.userInfo,
            this.lastMessage,
            this.forecast,
            this.conditions));
    }

    /// MAIN

    async onTurn(context: TurnContext): Promise<void> {

        switch (context.activity.type) {
            case ActivityTypes.ConversationUpdate:
                await this.welcomeMembers(context);
                break;

            /// MESSAGES
            case ActivityTypes.Message:
                const dc = await this.dialogs.createContext(context);
                await dc.continueDialog();
                if (!context.responded) {
                    await dc.beginDialog(RouteDialog.dialogId);
                }
                break;

            case ActivityTypes.Event:
                await this.onTurnEvent(context);
                break;
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
    private async welcomeMembers(context: TurnContext) {
        for (const idx in context.activity.membersAdded) {
            if (context.activity.membersAdded[idx].id !== context.activity.recipient.id) {
                await context.sendActivity(WELCOME_TEXT);
            }
        }
    }
}

/** Return a date object representing the given time as of today */
export function parseTime(time: string, timezone: string) {
    const [hours, minutes, seconds] = time.split(':').map((x) => +x);
    return moment.tz(timezone).set({ hours, minutes, seconds }).toDate();
}

import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression';
import { Culture, recognizeDateTime } from '@microsoft/recognizers-text-date-time';
import { ActivityTypes, ConversationState, RecognizerResult, StatePropertyAccessor, TurnContext } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import { ComponentDialog, WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
import * as DarkSky from 'dark-sky';
import * as moment from 'moment';

import { UserInfo, UserLocation } from '../bot';
import { AzureMap } from '../map';
import { DateTime, WeatherEntity, WeatherIntent } from '../types';
import { WeatherContext } from '../weather-context';
import { OnBoardDialog } from './onboard';
import { WeatherFeatureDialog } from './weather-feature';
import { WeatherForecastDialog } from './weather-forecast';
import { WeatherIsItDialog } from './weather-is-it';

interface AskWeatherResult {
  text: string;
}

interface LastMessage {
  text: string;
}

export interface WeatherDialogOptions {
  conversation: ConversationState;
  userInfo: StatePropertyAccessor<UserInfo>;
  recognizer: LuisRecognizer;
  darkSky: DarkSky;
  map: AzureMap;
}

export class WeatherDialog extends ComponentDialog {

  static readonly dialogId = WeatherDialog.name;

  private lastMessage: StatePropertyAccessor<LastMessage>;

  constructor(private options: WeatherDialogOptions) {
    super(WeatherDialog.dialogId);
    const { conversation, userInfo, darkSky } = this.options;

    this.lastMessage = conversation.createProperty<LastMessage>('lastMessage');
    this
      .addDialog(new WaterfallDialog(`${this.id}.main`, [
        this.begin.bind(this),
        this.haveUser.bind(this),
        (step) => step.endDialog(),
      ]))
      .addDialog(new OnBoardDialog(userInfo))
      .addDialog(new WeatherForecastDialog(darkSky))
      .addDialog(new WeatherFeatureDialog(darkSky))
      .addDialog(new WeatherIsItDialog(darkSky));
  }

  private async begin(step: WaterfallStepContext) {
    const { userInfo } = this.options;

    const user = await userInfo.get(step.context);
    if (user) {
      const { text } = step.context.activity;
      const result: AskWeatherResult = { text };
      return await step.next(result);
    } else {
      return await step.beginDialog(OnBoardDialog.dialogId);
    }
  }

  private async haveUser(step: WaterfallStepContext) {
    const { context } = step;
    const request = await this.getWeatherContext(context);

    if (request.coordinates) {
      await this.haveUserLocation(step, request);
    } else {
      await this.requestUserLocation(context);
    }
  }

  private async haveUserLocation(step: WaterfallStepContext, request: WeatherContext) {
    const { context } = step;
    const intent = LuisRecognizer.topIntent(request.recognized);
    switch (intent) {
      case WeatherIntent.getForecast:
        await step.beginDialog(WeatherForecastDialog.dialogId, request);
        break;

      case WeatherIntent.getConditionsFeature:
        await step.beginDialog(WeatherFeatureDialog.dialogId, request);
        break;

      case WeatherIntent.getConditionsYesNo:
        await step.beginDialog(WeatherIsItDialog.dialogId, request);
        break;

      default:
        await context.sendActivity(`Sorry, I don't understand '${intent}'`);
        break;
    }

    if (!context.responded) {
      await step.beginDialog(WeatherForecastDialog.dialogId, request);
    }
  }

  private async getWeatherContext(context: TurnContext): Promise<WeatherContext> {
    const { recognizer } = this.options;
    const weather: WeatherContext = {};
    const recognized = await recognizer.recognize(context);
    const { entities } = recognized;
    const location = await this.getLocation(context, recognized);

    weather.recognized = recognized;

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

  private async getLocation(context: TurnContext, recognized: RecognizerResult): Promise<UserLocation> {
    const query = this.getLocationEntity(recognized);
    const userInfo = await this.options.userInfo.get(context, {});

    if (query) {
      const resp = await this.options.map.searchAddress({ query });
      const top = resp.results.find((x) => {
        return x.type === 'Point Address' || x.entityType === 'Municipality' || x.entityType === 'PostalCodeArea';
      });
      if (top) {
        const { entityType, position: { lat, lon }, address: { freeformAddress } } = top;
        const tz = await this.options.map.getTimezoneByCoordinates([lat, lon]);
        const userLocation: UserLocation = {
          coordinates: [lat, lon],
          name: freeformAddress,
          type: entityType,
          timezone: tz.TimeZones[0].Id,
        };
        if (!userInfo.location) {
          userInfo.location = userLocation;
          await this.options.userInfo.set(context, userInfo);
        }
        return userLocation;
      }
    }

    if (userInfo.location) {
      return userInfo.location;
    }
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
}

/** Return a date object representing the given time as of today */
function parseTime(time: string, timezone: string) {
  const [hours, minutes, seconds] = time.split(':').map((x) => +x);
  return moment.tz(timezone).set({ hours, minutes, seconds }).toDate();
}

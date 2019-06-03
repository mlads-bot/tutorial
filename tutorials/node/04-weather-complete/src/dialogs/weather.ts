import { TimexProperty } from '@microsoft/recognizers-text-data-types-timex-expression';
import { Culture, recognizeDateTime } from '@microsoft/recognizers-text-date-time';
import { ActivityTypes, ConversationState, RecognizerResult, StatePropertyAccessor, TurnContext } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import { ComponentDialog, WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
import * as DarkSky from 'dark-sky';
import * as moment from 'moment';
import 'moment-timezone';

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
      return await step.next();
    } else {
      return await step.beginDialog(OnBoardDialog.dialogId);
    }
  }

  private async haveUser(step: WaterfallStepContext) {
    const { context } = step;

    if (step.result && step.result.text) {
      step.context.activity.text = step.result.text;
    }

    const request = await this.getWeatherContext(context);

    if (request.coordinates) {
      await this.haveUserLocation(step, request);
    } else {
      await this.requestUserLocation(context);
    }

    return await step.endDialog();
  }

  private async haveUserLocation(step: WaterfallStepContext, request: WeatherContext) {
    // NEW CODE GOES HERE
  }

  private async getWeatherContext(context: TurnContext): Promise<WeatherContext> {
    const { recognizer } = this.options;
    const weather: WeatherContext = {};
    const recognized = await recognizer.recognize(context);
    const { entities } = recognized;
    const location = await this.getLocation(context, recognized);

    weather.recognized = recognized;

    if (location) {
      // NEW CODE GOES HERE
    }
    return weather;
  }

  private async getLocation(context: TurnContext, recognized: RecognizerResult): Promise<UserLocation> {
    // NEW CODE GOES HERE

    return null; // <- delete this line
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

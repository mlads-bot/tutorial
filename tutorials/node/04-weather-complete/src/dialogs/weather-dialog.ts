import { StatePropertyAccessor } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import { ComponentDialog, WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
import * as DarkSky from 'dark-sky';

import { UserInfo } from '../bot';
import { AzureMap } from '../map';
import { OnBoardDialog } from './onboard-dialog';

interface AskWeatherResult {
  text: string;
}

export interface WeatherDialogOptions {
  userInfo: StatePropertyAccessor<UserInfo>;
  recognizer: LuisRecognizer;
  darkSky: DarkSky;
  map: AzureMap;
}

export class WeatherDialog extends ComponentDialog {

  static readonly dialogId = WeatherDialog.name;

  constructor(private options: WeatherDialogOptions) {
    super(WeatherDialog.dialogId);

    const { userInfo } = this.options;

    this.addDialog(new WaterfallDialog(`${this.id}.main`, [
      this.begin.bind(this),
      this.haveUser.bind(this),
    ]));

    this.addDialog(new OnBoardDialog(userInfo));
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
    const { recognizer } = this.options;
    const recognized = await recognizer.recognize(context);
    const intent = LuisRecognizer.topIntent(recognized);
    const { entities } = recognized;
    await context.sendActivity(`I understand you want to know about __${intent}__.`);
    await context.sendActivity(`I also found the following entities: ${JSON.stringify(entities)}`);
    return step.endDialog();
  }
}

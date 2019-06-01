import { StatePropertyAccessor } from 'botbuilder';
import { LuisRecognizer } from 'botbuilder-ai';
import { ComponentDialog, WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';

import { UserInfo } from '../bot';
import { OnBoardDialog } from './onboard-dialog';

interface AskWeatherResult {
  text: string;
}

export class WeatherDialog extends ComponentDialog {

  static readonly dialogId = WeatherDialog.name;

  constructor(
    private recognizer: LuisRecognizer,
    private userInfo: StatePropertyAccessor<UserInfo>) {
    super(WeatherDialog.dialogId);

    this.addDialog(new WaterfallDialog(`${this.id}.main`, [
      this.begin.bind(this),
      this.haveUser.bind(this),
    ]));

    this.addDialog(new OnBoardDialog(this.userInfo));
  }

  private async begin(step: WaterfallStepContext) {
    const user = await this.userInfo.get(step.context);
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
    const recognized = await this.recognizer.recognize(context);
    const intent = LuisRecognizer.topIntent(recognized);
    const { entities } = recognized;
    await context.sendActivity(`I understand you want to know about __${intent}__.`);
    await context.sendActivity(`I also found the following entities: ${JSON.stringify(entities)}`);

    return step.endDialog();
  }
}

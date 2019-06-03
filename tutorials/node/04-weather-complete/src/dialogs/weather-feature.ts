import { Dialog, DialogContext, DialogTurnResult, DialogTurnStatus } from "botbuilder-dialogs";
import * as DarkSky from 'dark-sky';

import { WeatherCondition, WeatherEntity } from "../types";
import { getWeather, WeatherContext } from "../weather-context";
import { getUnits } from "../weather-units";

export class WeatherFeatureDialog extends Dialog<WeatherContext> {

  static dialogId = WeatherFeatureDialog.name;

  constructor(private darkSky: DarkSky) {
    super(WeatherFeatureDialog.dialogId);
  }

  async beginDialog(dc: DialogContext, options?: WeatherContext): Promise<DialogTurnResult<any>> {
    const { context } = dc;
    const { resolvedLocation, recognized: { entities } } = options;
    const { daily, currently, flags } = await getWeather(this.darkSky, options, 'minutely', 'hourly');
    const conditions: WeatherCondition[][] = entities[WeatherEntity.condition] || [];
    const [dayData] = daily.data;

    if (conditions.length) {
      const [[condition]] = conditions;
      const tempUnits = getUnits('temperature', flags.units);

      switch (condition) {
        case WeatherCondition.high:
          await context.sendActivity(`The high temperature today in ${resolvedLocation} is ${dayData.temperatureHigh} ${tempUnits}`);
          break;

        case WeatherCondition.low:
          await context.sendActivity(`The low temperature today in ${resolvedLocation} is ${dayData.temperatureLow} ${tempUnits}`);
          break;

        case WeatherCondition.temperature:
          await context.sendActivity(`The temperature in ${resolvedLocation} is ${currently.temperature} ${tempUnits}`);
          break;

        default:
          throw new Error('Unknown condition: ' + condition);
      }
    }

    const status = DialogTurnStatus.complete;
    return { status };
  }
}

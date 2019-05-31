import { RecognizerResult, TurnContext } from "botbuilder";
import DarkSky = require('dark-sky');

import { WeatherCondition, WeatherEntity, WeatherPrecipitation } from "../types";
import { getUnits } from "../weather-units";
import { getWeather, WeatherContext } from "./context";

const HOT_TEMP_F = 80;
const COLD_TMEP_F = 40;
const CLOUDY_COVERAGE = 0.6;
const WINDY_GUST_MPH = 40;
const HUMIDIY_DEW_POINT_DEGREES = 3;
const PRECIP_PROBABILITY = 0.2;

export class WeatherConditionsBot {

  constructor(private darkSky: DarkSky) { }

  async onTurnGetFeature(context: TurnContext, request: WeatherContext, recognized: RecognizerResult): Promise<void> {
    const { resolvedLocation } = request;
    const { daily, currently, flags } = await getWeather(this.darkSky, request, 'minutely', 'hourly');
    const { entities } = recognized;
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
  }

  async onTurnGetYesNo(context: TurnContext, request: WeatherContext, recognized: RecognizerResult): Promise<void> {
    const { entities } = recognized;
    const conditions: WeatherCondition[][] = entities[WeatherEntity.condition] || [];
    const precipitations: WeatherPrecipitation[][] = entities[WeatherEntity.precipitation] || [];

    if (precipitations.length) {
      const [[precipitation]] = precipitations;
      await this.getYesNoPrecip(context, request, precipitation);
    } else if (conditions.length) {
      const [[condition]] = conditions;
      await this.getYesNoFeature(context, request, condition);
    }
  }

  private async getYesNoPrecip(context: TurnContext, request: WeatherContext, precip: WeatherPrecipitation) {
    const { resolvedLocation } = request;
    const weather = await getWeather(this.darkSky, request, 'minutely', 'hourly', 'daily');
    const { precipType, precipIntensity, precipProbability } = weather.currently;

    if (precipIntensity) {
      await context.sendActivity(precip.toString() === precipType.toString()
        ? `Yes, it is currently ${precipType}ing in ${resolvedLocation}`
        : `No, but it is ${precipType}ing now in ${resolvedLocation}`);

    } else if (precipProbability > PRECIP_PROBABILITY) {
      await context.sendActivity(precip.toString() === precipType.toString()
        ? `Yes there is a ${precipProbability * 100} % chance of ${precipType} today in ${resolvedLocation}`
        : `No, but there is a ${precipProbability * 100} % chance of ${precipType} today in ${resolvedLocation}`);

    } else {
      await context.sendActivity(`No, it doesn't look like there is any ${precip} today in ${resolvedLocation}`);
    }
  }

  private async getYesNoFeature(context: TurnContext, request: WeatherContext, condition: WeatherCondition) {
    const { resolvedLocation } = request;
    const weather = await getWeather(this.darkSky, request, 'minutely', 'hourly');
    const [dayData] = weather.daily.data;
    switch (condition) {
      case WeatherCondition.heat:
        await context.sendActivity(dayData.temperatureHigh >= HOT_TEMP_F
          ? `Yes, it will be hot today in ${resolvedLocation}, with a high of ${dayData.temperatureHigh}`
          : `No, the high today in ${resolvedLocation} is ${dayData.temperatureHigh}`);
        break;

      case WeatherCondition.cold:
        await context.sendActivity(dayData.temperatureLow <= COLD_TMEP_F
          ? `Yes, it will be cold today in ${resolvedLocation} with a low of ${dayData.temperatureLow}`
          : `No, the low today in ${resolvedLocation} is ${dayData.temperatureLow}`);
        break;

      case WeatherCondition.cloudCoverage:
        await context.sendActivity(dayData.cloudCover >= CLOUDY_COVERAGE
          ? `Yes, the cloud coverage today in ${resolvedLocation} is ${dayData.cloudCover * 100}%`
          : `No, it will not be cloudy today in ${resolvedLocation}`);
        break;

      case WeatherCondition.sun:
        await context.sendActivity(dayData.cloudCover >= CLOUDY_COVERAGE
          ? `No, the cloud coverage today in ${resolvedLocation} is ${dayData.cloudCover * 100}%`
          : `Yes it will be sunny today in ${resolvedLocation}`);
        break;

      case WeatherCondition.windGust:
        await context.sendActivity(dayData.windGust >= WINDY_GUST_MPH
          ? `Yes, the wind gust speed in ${resolvedLocation} is ${dayData.windGust} mph`
          : `No, it will not be windy today in ${resolvedLocation}`);
        break;

      case WeatherCondition.humidity:
        await context.sendActivity(dayData.temperatureHigh - dayData.dewPoint < HUMIDIY_DEW_POINT_DEGREES
          ? `Yes, the humidity today in ${resolvedLocation} is ${dayData.humidity * 100}%`
          : `No, it will not be humid today in ${resolvedLocation}`);
        break;

      case WeatherCondition.fog:
        await context.sendActivity(dayData.icon === 'fog'
          ? `Yes, it will be foggy today in ${resolvedLocation}`
          : `No, it will not be foggy today in ${resolvedLocation}`);
        break;
    }
  }
}

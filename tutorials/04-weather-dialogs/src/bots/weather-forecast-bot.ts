import { TurnContext } from "botbuilder";
import DarkSky = require('dark-sky');
import { uniq } from "lodash";
import * as moment from 'moment';

import { getUnits } from "../weather-units";
import { findTime, findTimeRange, getWeather, WeatherContext } from "./context";

export class WeatherForecastBot {

  constructor(private darkSky: DarkSky) { }

  async onTurn(context: TurnContext, request: WeatherContext): Promise<void> {
    const { dateType } = request;
    switch (dateType) {
      case 'date': // e.g. today, tomorrow, wednesday
        await this.getForecastForDate(context, request);
        break;

      case 'time': // eg. at 10pm
      case 'datetime': // e.g. tomorrow at noon
        await this.getForecastForTime(context, request);
        break;

      case 'daterange': // e.g. this week
        await this.getForecastForDateRange(context, request);
        break;

      case 'timerange': // e.g. between 2:00 and 4:00
      case 'datetimerange': // e.g. this morning, tomorrow morning
        await this.getForecastForTimeRange(context, request);
        break;

      default: // current
        await this.getForecastForCurrent(context, request);
        break;
    }
  }

  private async getForecastForDate(context: TurnContext, weather: WeatherContext) {
    const { daily, flags } = await getWeather(this.darkSky, weather, 'minutely', 'hourly');
    const { date, dateLabel, resolvedLocation } = weather;
    const day = findTime(date, 'day', daily.data);
    if (day) {
      const dateText = dateLabel || ('on ' + moment(date).format('dddd'));
      const { summary, temperatureHigh } = day;
      const units = getUnits('temperatureHigh', flags.units);
      await context.sendActivity(`The weather in ${resolvedLocation} ${dateText} will be ${summary} with a high of ${temperatureHigh} ${units}`);
    } else {
      const dateText = moment(date).format('MMMM Do');
      await context.sendActivity(`Sorry, my forecast does not include ${dateText}`);
    }
  }

  private async getForecastForTime(context: TurnContext, weather: WeatherContext) {
    const { hourly, flags } = await getWeather(this.darkSky, weather, 'minutely', 'daily');
    const { date, resolvedLocation } = weather;
    const hour = findTime(date, 'hour', hourly.data);
    if (hour) {
      const dateText = moment(date).format('h a');
      const { summary, temperature } = hour;
      const units = getUnits('temperature', flags.units);
      await context.sendActivity(`The weather in ${resolvedLocation} at ${dateText} will be ${summary} and ${temperature} ${units}`);
    } else {
      const dateText = moment(date).format('MMMM Do h a');
      await context.sendActivity(`Sorry, my forecast does not include ${dateText}`);
    }

  }

  private async getForecastForDateRange(context: TurnContext, weather: WeatherContext) {
    const { daily } = await getWeather(this.darkSky, weather, 'minutely', 'daily');
    const { date, endDate, resolvedLocation, dateLabel } = weather;
    const dateRange = findTimeRange(date, endDate, daily.data);
    if (dateRange.length) {
      await context.sendActivity(`The conditions ${dateLabel} in ${resolvedLocation} will be ${daily.summary}`);
    } else {

      await context.sendActivity(`Sorry, my forecast does not include ${date} to ${endDate}`);
    }
  }

  private async getForecastForTimeRange(context: TurnContext, weather: WeatherContext) {
    const { hourly } = await getWeather(this.darkSky, weather, 'minutely', 'daily');
    const { date, endDate, resolvedLocation, dateLabel } = weather;
    const timeRange = findTimeRange(date, endDate, hourly.data);
    if (timeRange.length) {
      const conditions = uniq(timeRange.map((x) => x.summary)).join(', ');
      await context.sendActivity(`The conditions ${dateLabel} in ${resolvedLocation} will be ${conditions}`);
    } else {
      await context.sendActivity(`Sorry, my forecast does not include ${date} to ${endDate}`);
    }
  }

  private async getForecastForCurrent(context: TurnContext, weather: WeatherContext) {
    const { currently: { summary, temperature }, flags } = await getWeather(this.darkSky, weather, 'minutely', 'hourly', 'daily');
    const { resolvedLocation } = weather;
    const units = getUnits('temperature', flags.units);
    await context.sendActivity(`The current conditions in ${resolvedLocation} are ${summary} and ${temperature} ${units}`);
  }
}

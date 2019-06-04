# Weather Bot Complete - Node.js

This bot adds complete end-to-end integration between language understanding, geolocation, and weather services to the weather bot.

> ☑️ Please ensure that you have completed the [prerequisites](../../README.md#prerequisites)

## What this bot does

The bot asks the user where they are located and then answers questions about the weather around the world

Examples:

- Is it raining?
- Is it raining in Seattle?
- What is the weather tomorrow?
- What is the weather Friday night?
- Do I need an umbrella?

## Get started

> ☁️ Make sure you have published your LUIS model from the [previous tutorial](../02-weather-luis)!

### 1. Prepare dependencies

```bash
npm install
```

### 2. Configure Bot

Create a file, `.env`, as follows:

> You can copy your `.env` from the [previous tutorial](../02-weather-luis), but be sure to add values for `DARK_SKY_KEY` and `MAP_KEY`

```ini
LUIS_SUBSCRIPTION_KEY=<copy key from https://aka.ms/mlads-bot>
LUIS_SUBSCRIPTION_REGION=westus
LUIS_APP_ID_WEATHER=YOUR_APP_ID
LUIS_APP_ID_WEATHER=<copy key from https://aka.ms/mlads-bot>
DARK_SKY_KEY=<copy key from https://aka.ms/mlads-bot>
MAP_KEY=<copy key from https://aka.ms/mlads-bot>
```

### 3. Modify Bot Code

Edit the file at [src/dialogs/weather.ts](./src/dialogs/weather.ts) and add the following code:

Add to the __getLocation__ method (resolve a text location value to lat, lon coordinates)

```typescript
const { userInfo, map } = this.options;

// read user's location from stored onboarding data in case no location information was found in the utterance
const user = await userInfo.get(context, {});

// find suitable location text from entities
const utteranceLocation = this.getLocationEntity(recognized);
const query = utteranceLocation || user.locationText;

// resolve location query to [lat, lon]
if (utteranceLocation) {
  const resp = await map.searchAddress({ query });
  const top = resp.results.find((x) => {
    return x.type === 'Point Address' || x.entityType === 'Municipality' || x.entityType === 'PostalCodeArea';
  });
  if (top) {
    const { entityType, position: { lat, lon }, address: { freeformAddress } } = top;
    const tz = await map.getTimezoneByCoordinates([lat, lon]);
    const userLocation: UserLocation = {
      coordinates: [lat, lon],
      name: freeformAddress,
      type: entityType,
      timezone: tz.TimeZones[0].Id,
    };

    // store location as default user location
    if (!user.location) {
      user.location = userLocation;
      await userInfo.set(context, user);
    }
    return userLocation;
  }
}

// try to use stored user location
if (user.location) {
  return user.location;
}
```

Add to the __getWeatherContext__ method (the weather context defines all of the recognized attributes about the weather request: location, datetime, etc.)

```typescript
const { coordinates: [lat, lon], name, timezone } = location;
weather.locationType = location.type;
weather.coordinates = [lat, lon];
weather.requestedLocation = this.getLocationEntity(recognized);
weather.resolvedLocation = name;

// datetime parsing is complex. the bot should handle ranges, dates, times, past, and future values
if (entities.$instance[WeatherEntity.datetime]) {
  const [{ text }] = entities.$instance[WeatherEntity.datetime] as [{ text: string }];
  const [dateTime] = recognizeDateTime(text, Culture.English);
  const [past, future] = dateTime.resolution.values as [DateTime, DateTime];
  const { type, value, start, end, timex } = future || past;

  // special consideration must be given to the user's timezone
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
```

Add to the __haveUserLocation__ method (once we have resolved all of the weather request data, we can route the request to the correct dialog)

```typescript
const { context } = step;
const intent = LuisRecognizer.topIntent(request.recognized);

// map intent to the correct dialog handler
switch (intent) {

  // E.g. "what is the weather tomorrow?"
  case WeatherIntent.getForecast:
    await step.beginDialog(WeatherForecastDialog.dialogId, request);
    break;

  // E.g. "what is the high temperature?"
  case WeatherIntent.getConditionsFeature:
    await step.beginDialog(WeatherFeatureDialog.dialogId, request);
    break;

  // E.g. "will it rain today?"
  case WeatherIntent.getConditionsYesNo:
    await step.beginDialog(WeatherIsItDialog.dialogId, request);
    break;

  default:
    await context.sendActivity(`Sorry, I don't understand '${intent}'`);
    break;
}

// If the dialog did not respond, route to the forecast dialog
if (!context.responded) {
  await step.beginDialog(WeatherForecastDialog.dialogId, request);
}
```

Now edit [src/dialogs/weather-forecast.ts](./src/dialogs/weather-forecast.ts) and add the following code to the __getForecastForTime__ method:

```typescript
// get hourly forecast for the requested weather context
const { hourly, flags } = await getWeather(this.darkSky, weather, 'minutely', 'daily');
const { date, resolvedLocation } = weather;

// extract data for just the requested time
const hour = findTime(date, 'hour', hourly.data);
if (hour) {

  // format a detailed response
  const dateText = moment(date).format('h a');
  const { summary, temperature } = hour;
  const units = getUnits('temperature', flags.units);
  await context.sendActivity(`The weather in ${resolvedLocation} at ${dateText} will be ${summary} and ${temperature} ${units}`);
} else {
  const dateText = moment(date).format('MMMM Do h a');
  await context.sendActivity(`Sorry, my forecast does not include ${dateText}`);
}
```

### 4. Build the bot

```bash
npm run build
```

### 5. Start the bot

```bash
npm run start-dev
```

### 6. Connect to the bot

Open the __Bot Framework Emulator__ and point it to the file called `04-Weather-Complete.bot`. This file contains the connection endpoint for your bot.

You can now talk to your bot to ask about the weather.

> __TROUBLESHOOTING__ If you see a message `The key used is invalid, malformed, empty, or doesn't match the region`, double check that your LUIS app is set to `public`. You can also use the GUI at [luis.ai](https://luis.ai) (`manage` -> `application information` -> `Make this app public`)
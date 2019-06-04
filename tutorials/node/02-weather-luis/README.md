# Weather Bot with LUIS - Node.js

This bot introduces LUIS, a language understanding component, and integrates it with the bot

> ☑️ Please ensure that you have completed the [prerequisites](../../README.md#prerequisites)

## What this bot does

The bot responds to text messages with the names of __intent__ and __entities__ predicted by a LUIS model.

## Get started

> 🔑 Make sure you have your __[LUIS Authoring Key](https://docs.microsoft.com/en-us/azure/cognitive-services/LUIS/luis-concept-keys#authoring-key)__ ready to copy/paste!

### 1. Prepare LUIS model

A preconfigured LUIS model is available at [weather.lu](./data/weather.lu). The `.lu` format is a human readable LUIS format that allows us to easily define new utterances and labels, however, it must be converted to `.json` before we can use it. Convert it to JSON now:

> `npx` is a Node.js utility that allows us to install and run executable npm packages. You could also install the package globally (`npm install -g ludown`) and execute `ludown` directly, without the `npx` prefix.

```bash
npx ludown parse toluis --in data/weather.lu  -o data -n mlads-weather
```

You should now see a file at `data/mlads-weather.json`.

### 2. Import LUIS model

Now you can import your local `mlads-weather.json` into your own LUIS cloud workspace:

```bash
npx luis-apis import application --in data/mlads-weather.json --authoringKey YOUR_AUTHORING_KEY
```

You should see a JSON output for your new model.

Copy the `id` and `activeVersion` properties for later use.

### 3. Train LUIS model

Before you can make predicitions against your LUIS model, you must train it. Train it now:

```bash
npx luis-apis train version --appId YOUR_APP_ID_FROM_PREVIOUS_STEP --versionId 0.1 --wait --authoringKey YOUR_AUTHORING_KEY
```

> The first `import` always creates versionId `0.1`. As you iterate your own models, you should increment this value between changes, just like any other software release.

### 4. Publish LUIS model

Now that your model is trained, you can publish it so that it can start serving queries:

```bash
npx luis-apis publish version --appId YOUR_APP_ID --versionId 0.1 --authoringKey YOUR_AUTHORING_KEY
```

> You have now published to the `production` slot. As your operational needs evolve, you can explore publishing to the `staging` slot or by `version` (api [v3-preview](https://westus.dev.cognitive.microsoft.com/docs/services/luis-endpoint-api-v3-0-preview/operations/5cb0a9459a1fe8fa44c28dd8) only).

You can now run a test query against your published model:

```bash
npx luis-apis query --query "what is the weather tomorrow in boston?" --appId YOUR_APP_ID --authoringKey YOUR_AUTHORING_KEY
```

You should see JSON similar to:

```json
{
  "query": "what is the weather tomorrow in boston?",
  "topScoringIntent": {
    "intent": "Weather.GetForecast",
    "score": 0.8139579
  },
  "entities": [
    {
      "entity": "boston",
      "type": "Weather.Location",
      "startIndex": 32,
      "endIndex": 37,
      "score": 0.773479462
    },
    {
      "entity": "tomorrow",
      "type": "builtin.datetimeV2.date",
      "startIndex": 20,
      "endIndex": 27,
      "resolution": {
        "values": [
          {
            "timex": "2019-06-01",
            "type": "date",
            "value": "2019-06-01"
          }
        ]
      }
    },
    {
      "entity": "boston",
      "type": "builtin.geographyV2.city",
      "startIndex": 32,
      "endIndex": 37
    }
  ]
}
```

### 5. Make LUIS App Public

Typcially you will use the LUIS web portal to associate paid query keys to your LUIS apps. To simplify this tutorial, you will mark your LUIS app as "public" which means that anyone with a key who knows your `appId` can query your model at their own expense. For this tutorial, you will use a query key provided by us, which means you need to make your app public!

```bash
npx luis-apis update settings --public true --appId YOUR_APP_ID --authoringKey YOUR_AUTHORING_KEY
```

You should see a JSON response:

```json
{
  "code": "Success",
  "message": "Operation Successful"
}
```

Your LUIS model development is now complete. The remaining bot tutorials will all use the same language model.

### 6. Prepare dependencies

```bash
npm install
```

### 6. Configure Bot

In production, your bot will source configuration parameters from OS Environment Variables (via Azure Web App `app settings`, Kubernetes `env`, or equivalent). Until then, we need to set up your development environment to register environment variables without actually affecting the host.

Enter: `dotenv`, a development module that you will use to hoist configuration values from a local (git-ignored) configuration file into Environment Variables readable by the current Node.js process.

Copy the provided sample `.env` file:

> Windows users should manualy copy the file using an IDE like `vscode`.

```bash
cp .env.sample .env
```

Modify `.env` as follows:

```ini
LUIS_SUBSCRIPTION_KEY=<copy key from https://aka.ms/mlads-bot>
LUIS_SUBSCRIPTION_REGION=westus
LUIS_APP_ID_WEATHER=YOUR_APP_ID
```

### 7. Modify Bot Code

Edit the file at __[src/bot.ts](./src/bot.ts)__ and insert the following code in the `onMessage` method:

```typescript
const recognized = await this.luis.recognize(context);
const intent = LuisRecognizer.topIntent(recognized);
const { entities } = recognized;

await context.sendActivity(`I understand you want to know about __${intent}__.`);
await context.sendActivity(`I also found the following entities: ${JSON.stringify(entities)}`);
```

LUIS allows your bot to understand one `intent` and zero or more `entities`. The __intent__ is the vertical domain in which the user wants to engage. In advanced bots you may see a set of related intents called a __skill__. An entity describes specific named features within the intent's domain. __Time__ and __Location__ are two entities recognized by this model.

### 8. Build the bot

Convert TypeScript into runable JavaScript

```bash
npm run build
```

### 9. Start the bot

```bash
npm run start-dev
```

> `start-dev` is a custom script defined in `package.json` to account for the configuration values stored locally in `.env`. A production bot would invoke `npm start`

### 10. Connect to the bot

Open the __Bot Framework Emulator__ and point it to the file called `02-Weather-LUIS.bot`. This file contains the connection endpoint for your bot.

You can now talk to your bot to see greetings and intents + entities.

> __TROUBLESHOOTING__ If you see a message `The key used is invalid, malformed, empty, or doesn't match the region`, double check that your LUIS app is set to `public`. You can also use the GUI at [luis.ai](https://luis.ai) (`manage` -> `application information` -> `Make this app public`)
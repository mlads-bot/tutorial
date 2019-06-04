# Weather Bot with Dialogs - Node.js

This bot adds dialogs (directed back-and-forth conversations) to the weather bot.

> ☑️ Please ensure that you have completed the [prerequisites](../../README.md#prerequisites)

## What this bot does

The bot asks the user where they are located and stores the value for later use

## Get started

> ☁️ Make sure you have published your LUIS model from the [previous tutorial](../02-weather-luis)!

### 1. Prepare dependencies

```bash
npm install
```

### 2. Configure Bot

Create a file, `.env`, as follows:

> You can copy your `.env` from the [previous tutorial](../02-weather-luis)

```ini
LUIS_SUBSCRIPTION_KEY=<copy key from https://aka.ms/mlads-bot>
LUIS_SUBSCRIPTION_REGION=westus
LUIS_APP_ID_WEATHER=YOUR_APP_ID
```

### 3. Modify Bot Code

Edit the file at [src/index.ts](./src/index.ts) and add the following code to replace the `null` assignments:

```typescript
// storage holds our user state and conversation state
// in production we would use a cloud storage provider like Azure Blob
// this tutorial will use in-memory storage
const storage = createStorage();

// our bot has "memory" scoped to either a single conversation or for the lifespan of a user
const user = new UserState(storage);
const conversation = new ConversationState(storage);

// we will use the same LUIS model from the previous tutorial
const recognizer = createWeatherRecognizer();

// our adapter is now using a middleware utility to ensure that our state is automatically persisted after each turn
const adapter = createBotAdapter().use(new AutoSaveStateMiddleware(user, conversation));

// we pass state and luis dependencies into our bot (this is an example of Depdendency Injection)
const bot = new WeatherBot({ user, conversation, recognizer });
```

Edit the file at [src/bot.ts](./src/bot.ts) and add the following code inside the `onMessage` method:

```typescript
// A dialog context is created at the start of the turn to help us manage our DialogSet for the current state of the conversation
const dc = await this.dialogs.createContext(context);

// Instruct the dialog context to resume any dialogs that are expecting a user response (e.g. a text prompt)
await dc.continueDialog();

// If none of our dialogs gave a response it means that this is a cold start request and we should begin a new "weather" dialog
if (!context.responded) {
  await dc.beginDialog(WeatherDialog.dialogId);
}
```

Finally, edit the file at [src/onboard-dialog.ts](./src/dialogs/onboard-dialog.ts) and add the following code for the `promptName` and `captureName` methods:

__promptName()__

```typescript
// A prompt is a special kind of dialog that expects user input. Prompts are commonly used in WaterfallDialogs, as seen here
return await step.prompt(this.textPromptId, 'It looks like this is your first time here. What should I call you?');
```

__captureName()__

```typescript
// Read the `user` object from the state property accesor (if the property does not exist, we use the default value `{}`)
const user = await this.userInfo.get(step.context, {});

// Assign the value from the previous text prompt to the user name
user.name = step.result;

// Store the updated `user` state object to the store
await this.userInfo.set(step.context, user);

// Pass control to the next step in the waterfall array
return await step.next();
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

Open the __Bot Framework Emulator__ and point it to the file called `03-Weather-Dialogs.bot`. This file contains the connection endpoint for your bot.

You can now talk to your bot to see greetings, prompts, and intents + entities.

> __TROUBLESHOOTING__ If you see a message `The key used is invalid, malformed, empty, or doesn't match the region`, double check that your LUIS app is set to `public`. You can also use the GUI at [luis.ai](https://luis.ai) (`manage` -> `application information` -> `Make this app public`)
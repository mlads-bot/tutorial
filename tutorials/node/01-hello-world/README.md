# Hello World - Node.js

This is a simple bot with minimal dependencies, so you can get up and running quickly on Bot Framework. You will learn about the `onTurn` method and how to override it to handle bot activities.

> Please ensure that you have completed the [prerequisites](../../README.md#prerequisites)

## What this bot does

The bot simply echoes any text message back to the user.

## Get started

### 1. Prepare dependencies

Node.js projects are managed with the `npm` command line tool. Install the bot depdendencies now:

```bash
npm install
```

### 2. Modify bot code

Edit the file at __[src/bot.ts](./src/bot.ts)__ and insert the following code snippet where directed:

```typescript
const { type } = context.activity;
switch (type) {
  case ActivityTypes.ConversationUpdate:
    for (const added of context.activity.membersAdded) {
      const name = added.name || added.id;
      await context.sendActivity(`${name} has joined the chat!`);
    }
    break;

  case ActivityTypes.Message:
    const { name } = context.activity.from;
    const { text } = context.activity;
    await context.sendActivity(`${name} said "${text}"`);
    break;
}
```

This is a simple switch statement inside the `onTurn` method that branches on the incoming `ActivityType`. The bot replies to different activitie types in different ways.

Every bot starts with `onTurn`, and the logic that follows dictates the flow of the bot.

The `onTurn` method returns a `Promise` object which means that the implementation completes _asyncronously_. In addition, the method is flagged with the `async` keyword, which means that any _additional_ operations inside the implementation that also complete asyncronously should include the `await` keyword. This includes `context.sendActivity` which is an IO operation that delivers a message to the user.

> JavaScript's `Promise` and `async/await` constructs are similar to `Task` in C# and `asyncio` in Python.

Failure to include the `await` keyword on `Promise`-returning operations is a frequent cause of bugs.

> Advanced bots may choose to implement the [ActivityHandler](https://github.com/microsoft/botbuilder-js/blob/master/libraries/botbuilder-core/src/activityHandler.ts) class to take advantage of event-based activity handling.

### 3. Build the bot

Node.js projects may define custom scripts in their `package.json` file. Because this is a TypeScript project, we must define a build script. Inspect the `scripts` property in [package.json](./package.json) to see how this script is defined.

```bash
npm run build
```

After building the bot, you should now see a directory called `dist`. This directory contains a `.js` file for each of your `.ts` source files. TypeScript is not directly runable in Node.js, so we must _transpile_ into JavaScript.

### 4. Run the bot

Node.js reserves a few special script names that are common across all Node.js projects, including `start`. Reserved scripts can be executed without specifying `run`. Start your bot now:

```bash
npm start
```

You should now see that your bot is listening on the default port, `3978`.

### 5. Connect to the bot

Open the __Bot Framework Emulator__ and point it to the file called `01-Hello-World.bot`. This file contains the connection endpoint for your bot.

You can now talk to your bot to see both greetings and message echos.

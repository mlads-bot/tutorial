# Hello World Bot Weather 2

This is a simple bot with minimal dependencies, so you can get up and running quickly on Bot Framework. This shows you how to overwrite the `onTurn` method of the bot. This calls one of the other handlers, based on the type of activity received.

## Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/) (any JavaScript editor will work, but VSCode is preferred)
- [NodeJS (LTS)](https://nodejs.org/en/)
- [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases/tag/v4.2.1)
- A git command line client and [GitHub](https://github.com/) account

## Get started

1. Clone this repo and `cd` into this directory.
1. `npm install`
1. `npm start`
1. Open the `Bot1b.bot` in the Bot Framework emulator

## What the bot does

The bot simply echoes your requests text, taking the name of the user from the bot channel and displaying the `text` value.

## Code structure

- `index.ts`: Entry point to the bot web server. This is where the bot is instantiated and attached to the Express web server framework via a `BotFrameworkAdapter`.
- `settings.ts`: Expose configuration parameters used by the bot. For simple scenarios, configuration is read from the OS environment variables, but more advanced options include [Azure Key Vault](https://docs.microsoft.com/en-us/azure/key-vault/key-vault-whatis) and [Azure App Configuration](https://docs.microsoft.com/en-us/azure/azure-app-configuration/overview).
- `bot.ts`: contains the core logic of the bot, executed via the `onTurn` class function.

> Subsequent tutorials will build on this structure, with an emphasis on a separation of concerns.

## FAQ
- **Why are there two `conversationUpdate` messages shown when I start a new converation?**  
  The bot registers a new `conversationUpdate` for each member who joins the conversation--in this case, you and the bot.  
  
- **Do I need a Microsoft App Id and Password?**  
  These values are not needed when testing the bot locally in the emulator.
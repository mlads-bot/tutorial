# MLADS Spring 2019 - Bot Tutorial

## Prerequisites

The following tools are required for your development environment:   

- [Visual Studio Code](https://code.visualstudio.com/) (any JavaScript editor will work, but VSCode is recommended)
- [NodeJS](https://nodejs.org/en/) (LTS)
- [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases)
- Account on [luis.ai](https://luis.ai/)

Optional (only needed to deploy your bot to the cloud):
- [Azure](https://portal.azure.com) subscription
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)

## Format  

The tutorials in this repo will help you build progressively complex bots. You will start with a simple "hello world" bot to understand bot basics before adding more interesting components like:

- Language understanding with LUIS "ludown" files
- Interpret LUIS intent and entities in your bot
- Manage user and conversation state across turns
- Control UX with bot dialogs
- Call out to external APIs

## Tutorials

This repo contains four tutorials

1. **hello world**: A simple "echobot" that repeats messages to the user
    - [Node.js](./tutorials/node/01-hello-world)
    - [.NET Core](./tutorials/dotnet/01-hello-world)
    - [Python](./tutorials/python/01-hello-world)
1. [weather](./tutorials/02-weather): Build a LUIS weather model and integrate it with a simple stateless bot
1. [weather-state](./tutorials/03-weather-state): Add "memory" (state) to the bot
1. [weather-dialogs](./tutorial/03-weather-dialogs): Add dialogs to the bot

## Contributing

> This repo is currently only accepting bug fixes, not feature requests. If you spot a bug, please open an issue, and if possible, open a PR.

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.


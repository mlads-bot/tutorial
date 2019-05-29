## Prerequisites

The following tools are required for your development environment:   

- [Visual Studio Code](https://code.visualstudio.com/) (any JavaScript editor will work, but VSCode is preferred)
- [NodeJS (LTS)](https://nodejs.org/en/)
- [.NET Core (2.2 runtime)](https://github.com/dotnet/core/blob/master/release-notes/2.2/2.2.2/2.2.2-download.md)
- [Bot Framework Emulator](https://github.com/Microsoft/BotFramework-Emulator/releases/tag/v4.2.1)
- [Azure](https://portal.azure.com) subscription
- Account on [luis.ai](https://luis.ai/)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)
- A git command line client and [GitHub](https://github.com/) account  

All of these tools are cross-platform.

## Hackathon Format  

The format of the hackathon will include building progressively complex bots. We will start with a simple `hello world` bot to understand some bot basics before adding more interesting components including:  
- Use code-first LUIS model approach with “ludown” files  
- Interpret LUIS intent and entities in the bot  
- State/session/user management  
- Control UX with bot dialogs  
- Separate domain specific models using LUIS dispatch  
- Integrate LUIS dispatch into the bot using Skills  

This GitHub repo includes sample implementations of these concepts, with each concept separated into its own branch. We will cover each in-depth by switching to the respective branches.  

## Hackathon bots

This repo contains six sample bots that we will use to ramp up on Bot Framework for NodeJS:

1. **01-hello-world-weather** - A simple echo bot with minimal dependencies
1. **02-luis** - Introduce LUIS concepts, including modeling, tools, and bot integration
1. **03-luis-state** - Add "memory" to the bot to manage session state
1. **04-luis-state-dialogs** - Add dialogs to manage UX and conversation flow
1. **05-luis-dispatch** - Introduce LUIS dispatch concepts and tools
1. **06-luis-dispatch-skills** - Use dialogs to separate handling of different skills

## Hackathon Focus  

The focus will be on the **reminder bot** and **trivia bot** scenarios. We will minimize the scope of tuning the LUIS models to leave more time for developing bot mechanics (i.e. use simple LUIS models to prove the concept, not perfecting them).

We can also cover other areas of interest, time permitting, including WebChat, DirectLine (including websocket), **i18n**, and hosting the bot in Azure (e.g. containers).

If there are other areas of interest beyond the ones mentioned here, please let us know prior to the hackathon via <jio_aicat@microsoft.com>


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


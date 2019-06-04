# EchoBot for .NET

## Get Started

### 1. Create the web project

```bash
dotnet new web
```

This creates a standard ASP.NET scaffold

### 2. Remove Unneeded Template Depdendencies

```bash
dotnet remove package Microsoft.AspNetCore.Razor.Design
```

### 3. Add BotBuilder Depdendencies

```bash
dotnet add package Microsoft.Bot.Builder.Integration.AspNet.Core
```

### 4. Modify `Startup.cs`

Edit the file at [Startups.cs](./Startup.cs) and add usings:

```csharp
using Microsoft.Bot.Builder.Integration.AspNet.Core;
```

Then add dependency injections to `ConfigureServices` method:

```csharp
services.AddSingleton<IBotFrameworkHttpAdapter, BotFrameworkHttpAdapter>();
services.AddTransient<IBot, EchoBot>();
```

### 5. Create BotController.cs

The bot controller routes HTTP requests to your bot's logic.

Create a file at [Controllers/BotController.cs](./Controllers/BotController.cs) with the following content:

```csharp
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Integration.AspNet.Core;

namespace Microsoft.BotBuilderSamples.Controllers
{
  [Route("api/messages")]
  [ApiController]
  public class BotController : ControllerBase
  {
    private readonly IBotFrameworkHttpAdapter Adapter;
    private readonly IBot Bot;

    public BotController(IBotFrameworkHttpAdapter adapter, IBot bot)
    {
      Adapter = adapter;
      Bot = bot;
    }

    [HttpPost]
    public async Task PostAsync()
    {
      // Delegate the processing of the HTTP POST to the adapter.
      // The adapter will invoke the bot.
      await Adapter.ProcessAsync(Request, Response, Bot);
    }
  }
}
```

### 6. Create EchoBot.cs

Create a file at [EchoBot.cs](./EchoBot.cs) with the following content:

```csharp
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;

namespace Microsoft.BotBuilderSamples.Bots
{
  public class EchoBot : ActivityHandler
  {
    protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
    {
        await turnContext.SendActivityAsync(MessageFactory.Text($"Echo: {turnContext.Activity.Text}"), cancellationToken);
    }

    protected override async Task OnMembersAddedAsync(IList<ChannelAccount> membersAdded, ITurnContext<IConversationUpdateActivity> turnContext, CancellationToken cancellationToken)
    {
      foreach (var member in membersAdded)
      {
          if (member.Id != turnContext.Activity.Recipient.Id)
          {
            await turnContext.SendActivityAsync(MessageFactory.Text($"Hello and welcome!"), cancellationToken);
          }
      }
    }
  }
}
```

### 7. Build your bot

```bash
dotnet build
```

### 8. Start your bot

```bash
dotnet run
```
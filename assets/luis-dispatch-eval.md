# Evaluate a Model with the LUIS Dispatch Tool

## Get Started

### 1. Initialize the LUIS dispatch tool

```bash
npx botdispatch init --dataFolder dispatch
```

You will be asked to provide 3 values:

1. `Name`: Choose an unique name, relative to your other LUIS apps, like `WeatherDispatch`
2. `Authoring Key`: Use the same authoring key you used in the previous tutorials
3. `Authoring Region`: Choose the region closest to you

### 2. Add your LUIS app

```bash
npx botdispatch add --dataFolder dispatch --type luis --id YOUR_LUIS_APPID
```

### 3. Create the dispatch compnents

```bash
npx botdispatch create --dataFolder dispatch --hierarchical false
```

> By default `botdispatch` will configure a routing mechanism between multiple different LUIS models, which is known as `hierarchical`. Because we only have one model, we disable this feature.

### 4. Evaluate the dispatch model

```bash
npx botdispatch eval --dataFolder dispatch --luisSubscriptionKey LUIS_SUBSCRIPTION_KEY --luisSubscriptionRegion LUIS_SUBSCRIPTION_REGION
```

> You can use the LUIS Subscription values from the previous tutorials.

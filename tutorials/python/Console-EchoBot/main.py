# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

import asyncio
from botbuilder.core import TurnContext, ConversationState, MemoryStorage
from botbuilder.schema import ActivityTypes

from adapter import ConsoleAdapter

# Create adapter
adapter = ConsoleAdapter()

# Create MemoryStorage, UserState and ConversationState
memory = MemoryStorage()
conversation_state = ConversationState(memory)

# Register conversation state middleware on the adapter.
adapter.use(conversation_state)


async def logic(context: TurnContext):
    if context.activity.type == ActivityTypes.message:
        state = await conversation_state.get(context)

        # If our conversation_state already has the 'count' attribute, increment state.count by 1
        # Otherwise, initialize state.count with a value of 1
        if hasattr(state, "count"):
            state.count += 1
        else:
            state.count = 1
        await context.send_activity(
            f'Conversation count is {state.count} and you said "{context.activity.text}"'
        )
    else:
        await context.send_activity(f"[{context.activity.type} event detected]")


loop = asyncio.get_event_loop()

if __name__ == "__main__":
    try:
        # Greet user
        print("Hi... I'm an echobot. Whatever you say I'll echo back.")

        loop.run_until_complete(adapter.process_activity(logic))
    except KeyboardInterrupt:
        pass
    finally:
        loop.stop()
        loop.close()

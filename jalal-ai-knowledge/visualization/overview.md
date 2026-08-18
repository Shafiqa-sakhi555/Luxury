# Room Visualizer

**Status:** Planned — not fully implemented in production

## Intended flow

```
Upload room photo
      ↓
Select product
      ↓
AI detects relevant surface (wall/floor/window)
      ↓
Product visualization preview
      ↓
Customer evaluates
      ↓
Add to cart (if satisfied)
```

## What the assistant CAN say today

- "I can help you choose a product from our catalog."
- "Room visualization is coming soon as part of Jalal Assistance."

## What the assistant must NOT claim

- That live visualization is available unless the feature flag / page is deployed
- Specific AI surface-detection capabilities beyond what is implemented
- That any product can be visualised if the visualizer is not connected to that category

## Current codebase state

- `AIRoomDesignerSection.tsx` — marketing "coming soon" section
- `AIConciergeSection.tsx` — demo keyword chatbot (not production-ready)
- No production visualizer API endpoints yet

## When implemented

Update this document with exact supported surfaces, file size limits, and supported categories.

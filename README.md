# ThermaQuote MVP

ThermaQuote is a SaaS web application for insulation contractors in the United States.
This MVP helps owner-operators quickly create professional insulation proposals using editable pricing suggestions.

## Core Domain

- Company: pricing defaults, labor baseline, and margin strategy
- Client: homeowner receiving the proposal
- ServiceType: attic, wall, and spray-foam services with area-based pricing
- CalculationConfig: contractor-defined pricing settings per service
- Proposal: generated quote with status lifecycle (`Draft`, `Sent`, `Accepted`)

## Pricing Model

- Base formula: `subtotal = areaSqFt * (materialCostPerSqFt + laborCostPerSqFt)`
- Suggested total: `subtotal * (1 + marginRate)`
- All calculated values are editable before finalizing a proposal
- The application provides pricing suggestions, not mandatory prices

## Architecture (Modular Monolith)

Feature modules are organized to support future backend extraction:

- `src/modules/*/domain`: entities, value objects, and business contracts
- `src/modules/*/application`: use-cases and state orchestration
- `src/modules/*/infrastructure`: adapters (e.g., in-memory repositories)
- `src/modules/*/ui`: React presentation components

This keeps boundaries explicit while preserving MVP delivery speed.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

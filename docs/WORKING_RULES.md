# WORKING RULES – Q8 Parking PWA

## Role of the User
- The user is NOT a developer.
- The user acts as Product Manager / Product Owner.
- The user cannot read or review code.
- The user should never be asked to review diffs, files, or technical choices.

## Responsibility of Agents
- Agents are responsible for making SAFE changes.
- Agents must work incrementally.
- Agents must avoid large refactors unless explicitly requested.
- If unsure, choose the safest option or stop and explain in plain language.

## How to Work
- Focus on ONE functional flow at a time.
- Prefer restoring existing logic over inventing new logic.
- Do not require technical input from the user.
- Explain changes in product terms (what improved, what works now).

## Restrictions
- Do NOT touch deployment, Firebase config, API keys, or hosting unless explicitly requested.
- Do NOT redesign UI unless explicitly requested.
- Avoid modifying index.html unless explicitly requested.

## Conflict Handling
- If multiple agents are active:
  - Only ONE agent may modify code at a time.
  - Other agents must be read-only and provide instructions or analysis only.

## Mandatory Rule
Before making any changes:
- Read this file.
- Follow it.
- If this file is missing or unclear, STOP and ask the user.

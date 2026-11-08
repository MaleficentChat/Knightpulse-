# Maleficent Chat — independent rebuild

This directory is the clean implementation track. It is deliberately isolated from the current production entry point so the running service and its database remain untouched while the replacement is built and tested.

## Non-negotiable rebuild rules

- Do not copy whole files or transplant legacy route handlers.
- Reimplement behavior from explicit requirements and observed API contracts.
- Reuse only small, reviewed algorithms or design patterns when their behavior is understood.
- Keep HTTP transport, domain rules, persistence, and presentation separate.
- Use parameterized SQL and explicit migrations; never reset or drop production data.
- Add focused tests for every permission boundary and state transition.
- Move production traffic only after parity checks, migration review, and an explicit cutover.

## Target layout

- `src/config`: validated environment configuration.
- `src/core`: errors, authorization policy, validation primitives.
- `src/domain`: feature rules and use-cases, independent of Express and SQL.
- `src/ports`: interfaces for persistence, realtime delivery, and notifications.
- `src/adapters`: PostgreSQL, HTTP, Socket.IO, and push implementations.
- `src/http`: route registration and request/response mapping.
- `src/realtime`: authenticated socket lifecycle and room delivery.
- `src/web`: independently built responsive client.
- `migrations`: additive, reversible schema changes.
- `test`: unit, integration, and authorization regression tests.

## First slice

The first independently implemented slice is the rank/permission policy. Feature routes must call this policy rather than embedding role comparisons in handlers. The policy is tested without a database or web server.

## Production safety

The existing app on `main` is retained as a safety baseline. Work on this branch is not connected to Render auto-deploy. The existing database is not modified by this rebuild branch.

# Maleficent Chat — rebuild

This repository is the clean rebuild target. The previous application is a behavioral and compatibility reference, not a directory to clone wholesale.

## Migration rules
- Port only runtime-critical, reviewed modules; omit legacy experiments and optional clients until they are audited.
- Keep PostgreSQL as the durable source of truth. Do not reset, drop, or recreate existing user/message data during application migration.
- Rebuild the News publishing and notification-center flows as isolated modules with server-side authorization, ownership checks, durable writes, and explicit API contracts.
- Preserve the established rank hierarchy and account/session compatibility.
- Run syntax/security checks before each commit. Deployment and live database verification are separate steps.

## Current milestone
Initial core migration and reliability pass. Features that have not been ported or verified are not represented as complete.

# Agent instructions

## GitHub work tracking

Read `.github/WORK_TRACKING.md` before creating, deferring, or closing work.

- GitHub Issues and the private `Affective Technologies: Stewarded Services` Project, number 5, are the source of truth.
- Each leaf issue belongs to exactly one Project. Cross-product initiatives use a parent issue with product-owned child issues.
- Search for an owning issue before beginning deferred, risky, multi-session, cross-repository, or human-step work.
- A tiny fix completed immediately may go directly to a pull request.
- When an issue is created from the CLI, add and classify it with `.github/scripts/project-item.sh` before finishing the turn.
- Use `Closes #N` only when the pull request fully satisfies and verifies the issue. Use `Refs #N` for partial work.
- Do not mark an item Done or close a human-step issue until its real-world verification is recorded.

## GitHub authorization

Local agents may use the authenticated `gh` CLI for issue, Project, and pull-request work within the user's request.

- Never request or print a GitHub token. Authentication belongs in the user's keyring.
- If `gh auth status` fails, report the local login or refresh command instead of asking for credentials in chat.
- Do not delete repositories or Projects, change visibility, alter collaborators or authentication, or weaken branch protections.
- Merge pull requests or close issues only when requested work is complete and required checks have passed.

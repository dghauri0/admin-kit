# GitHub work tracking

This repository uses GitHub Issues and the private [Affective Technologies: Stewarded Services Project](https://github.com/users/dghauri0/projects/5) for planning and status.

Repository: [dghauri0/admin-kit](https://github.com/dghauri0/admin-kit) · Project product value: `Shared Platform`

## What belongs where

- Create an issue for deferred, risky, multi-session, cross-repository, operational, or human-step work.
- Use a Project draft for an evidence-gated possibility that is not yet committed work.
- A tiny fix completed immediately may go directly to a pull request.
- Each leaf issue belongs to exactly one Project. Cross-product initiatives use a parent issue with product-owned child issues.
- Keep durable specifications and runbooks in the repository. Issues own status and link to them.

## Starting and finishing work

1. Search open issues before starting work that should have an owner.
2. Create or refine the issue so its outcome and acceptance criteria are testable.
3. Ensure the Project item has Status, Priority, Horizon, Product, Work type, and Effort. Start date and Target date are optional roadmap fields.
4. Move Status to `In progress` when active, `Blocked` only for a real dependency, or `Human step` when a dashboard, approval, or physical action is next.
5. Use `Closes #N` for a pull request that fully resolves the issue; use `Refs #N` otherwise.
6. Close or mark Done only after tests and operational or human verification are recorded.

## Agent CLI workflow

Check the shared GitHub CLI login without exposing credentials:

```bash
gh auth status
```

For a CLI-created issue, classify it immediately:

```bash
issue_url=$(gh issue create --title "…" --body "…")
.github/scripts/project-item.sh "$issue_url" "Shared Platform" Feature P3 Next M Inbox
```

Arguments:

```text
project-item.sh URL_OR_ITEM_ID PRODUCT WORK_TYPE [PRIORITY] [HORIZON] [EFFORT] [STATUS]
```

Current conventions:

- Status: Inbox, Ready, In progress, Blocked, Human step, Done
- Priority: P0, P1, P2, P3, P4
- Horizon: Now, Next, Later, Someday
- Product: House Desk, Pub, Beacon, Shared Platform, Service Docs, Cross-product
- Work type: Bug, Feature, Debt, Ops, Hardware, Research, Docs
- Effort: XS, S, M, L

For an evidence-gated draft:

```bash
item_id=$(gh project item-create 5 --owner dghauri0 --title "…" --body "…" --format json --jq .id)
.github/scripts/project-item.sh "$item_id" "Shared Platform" Research P4 Someday M Inbox
```

Before ending a session that changed planning state, verify every touched item has all six required custom fields populated.

## Safety boundary

Never include secrets, resident data, private infrastructure addresses, or unsanitized production logs in issues or Project items.

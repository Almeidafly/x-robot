# Branch model

- **main** — always lit. Only updated by release/ or hotfix/ PRs, merged by the owner.
- **develop** — integration branch; all work merges here first, CI must be lit.
- **feat/<name>** — feature work, PR into develop.
- **fix/<name>** — bug fixes, PR into develop.
- **try/<name>** — throwaway experiments; never merged directly.
- **release/<version>** — or a develop → main PR; owner merges.
- **hotfix/<name>** — urgent fix from main, merged back into main and develop.
- **archive/<name>** — tag + branch with the same name, created before anything is retired or main is updated.

## Rules
- Never delete or rename branches or tags.
- Never force-push.
- Before updating main: `git tag archive/<name> main && git branch archive/<name> main`, push both
  (`git push origin refs/tags/archive/<name> refs/heads/archive/<name>`).
- CI light must be lit before merging.

## Archives so far
- `archive/design-v0` — the design-only main (README + DESIGN.md).

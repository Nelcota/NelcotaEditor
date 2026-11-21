---
name: ship
description: Commit, push, open a pull request and merge it to main in one go, when the person asks to ship ("commit e push", "abre PR", "merge no main", "manda pra main").
---

# Ship

The person types commit, push, PR and merge as separate prompts. Do them in one pass, stopping only where marked.

1. Run `npx oxfmt`, then `npm run check`. Fix what fails. Never pass `--no-verify`.
2. Show `git status --short`. Stage only the files of this work; leave unrelated changes and anything that looks like a secret out, and say so.
3. If on `main`, create a branch `feat/…` or `fix/…` first. Commit with a Conventional Commits subject in English (≤ 72 chars) and a short body on the why.
4. Push the branch and open a pull request with `gh pr create` (English title and body: summary, how to test).
5. **Stop and ask** before merging, unless the person's message already said to merge. Then `gh pr merge --rebase` (main is linear), `git checkout main`, `git pull --ff-only`.
6. Report the commit hash, the PR link and whether it was merged.

# Push changes

Stage all modified files, write a concise commit message based on the diff, commit, and push to origin/main.

Steps:
1. Run `git status` and `git diff` to understand what changed
2. Stage relevant files with `git add` (specific files, not `-A` blindly — skip .env files)
3. Write a commit message: short subject line (≤72 chars), imperative mood, focused on the "why" not the "what". Add `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` trailer.
4. Commit and run `git push`
5. Report the commit hash and what was pushed

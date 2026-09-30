# OMP working rules

- When an implementation plan changes behavior or a public contract, include a short Testing section: affected scenario, focused test or direct smoke check, and expected observable result. Omit it for read-only or documentation-only work unless behavior actually needs checking.
- After implementing a requested change in a Git repository, unless project instructions forbid staging, review files created for the task and stage only non-ignored ones with `git add -- <explicit paths>`. Do not stage pre-existing untracked files, modified tracked files, or unrelated files without a request; never use broad or forced staging, and do not commit without a request.

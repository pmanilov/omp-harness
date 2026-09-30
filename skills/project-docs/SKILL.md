---
name: project-docs
description: Create evidence-based Markdown project documentation when scaffolding a new project, or when explicitly asked to generate, review, or update documentation for an existing project.
---

# Project documentation

First read `skill://project-docs/references/format.md`, the canonical format and aspect map. Keep the reference inside this skill so installation by symlink works.

A bare interactive `/skill:project-docs` invocation is an explicit request to generate or update this project's documentation using this workflow. Do not ask for scope solely because no arguments were supplied. Additional arguments narrow or change that request; read-only planning and explicit review restrictions still take precedence.

Follow this workflow in order:

1. Respect planning and request scope. In read-only planning mode, investigate and plan only; write after execution is authorized. An investigation or review request also permits findings, not edits. Distinguish user-requested creation of a new project from work in an existing repository: missing documentation alone does not trigger generation. A request for one aspect applies this skill only to that aspect, not the entire set.
2. Read already provided project instructions and relevant existing documentation. Inspect entry points, manifests/scripts, configuration examples, public interface schemas, and existing checks. Do not scan unrelated projects, dependencies, logs, or secret values for an overview.
3. Map each in-scope reference aspect to its existing authoritative document or section before writing. Preserve existing documentation language and paths; for a new project use the request's language. When scaffolding a new implemented project without prior documentation owners, use README.md, docs/ARCHITECTURE.md, and docs/DEVELOPMENT.md for the confirmed core aspects; a README just written during this task is not a pre-existing owner of every aspect. Use conditional documents only with confirmed content. Do not create empty files; report missing evidence in the result. Without implementation or technical decisions, create only the README described in the reference.
4. Write concise documentation from sources. State command prerequisites and working directories; link architectural facts to actual implementation paths or symbols. Separate current implementation from confirmed user requirements or plans. Do not invent commands, versions, SLAs, deployment procedures, owners, licenses, or historical decision rationale. Make conflicts between implementation and planned behavior explicit rather than silently removing an agreed plan.
5. In existing documents, change only relevant sections and links. Preserve accurate useful content and user changes. Do not recreate whole files, move them between directories, or delete other documents. If multiple authoritative documents cover a topic without an obvious owner, preserve them and report the specific conflict instead of silently selecting a new canonical copy.
6. Add README links only to documents that actually exist, not conditional files still to be created. If the already loaded root project `AGENTS.md` permits editing, add a short document index without copying chapters or `@`-importing the corpus. Do not create a new AGENTS file solely for an index; README is enough for navigation.
7. For documentation generation, change only documentation and its permitted index. Do not install dependencies or modify source code, CI, or project configuration to make the text true. During new-project creation this restriction applies to the documentation stage, not to the requested implementation.
8. Check local links and source support for claims. Run only safe, already available direct checks of examples. Do not install, deploy, migrate, make paid external calls, or perform destructive operations just to verify documentation. Distinguish a command read from a command executed; never claim verification without observed output.
9. Return created/changed documents, sources used, checks actually executed, and specific unconfirmed information. Follow existing project Git staging rules; do not introduce an alternative staging process.

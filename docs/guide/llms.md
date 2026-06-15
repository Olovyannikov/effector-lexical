# Working with LLMs

This project ships first-class tooling for LLMs and coding agents, so you can get
accurate `effector-lexical` code with far less hand-holding.

## `llms.txt` and `llms-full.txt`

Two machine-readable files are served from the docs site:

- <https://olovyannikov.github.io/effector-lexical/llms.txt>
- <https://olovyannikov.github.io/effector-lexical/llms-full.txt>

They live in [`docs/public/`](https://github.com/Olovyannikov/effector-lexical/tree/main/docs/public)
and are published as-is.

[`llms.txt`](https://github.com/Olovyannikov/effector-lexical/blob/main/docs/public/llms.txt)
follows the [llms.txt convention](https://llmstxt.org/): a concise, link-rich
Markdown index that points an LLM at the most relevant docs. It is a map, not the
territory — an agent reads it to decide what to fetch next.

[`llms-full.txt`](https://github.com/Olovyannikov/effector-lexical/blob/main/docs/public/llms-full.txt)
goes further: it inlines the condensed full API plus the key recipes, so an LLM
can consume everything the library offers in a single fetch — no follow-up
requests needed.

## Claude Code skill

A Claude Code skill lives at
[`.claude/skills/effector-lexical/SKILL.md`](https://github.com/Olovyannikov/effector-lexical/blob/main/.claude/skills/effector-lexical/SKILL.md).
It teaches an agent how to actually use the library: `createEditorModel`,
`EditorProvider`, binding commands, attaching a `scope`, and the lifecycle rules.
When you work inside the repo with Claude Code it is auto-loaded, so the agent
already knows the conventions before you ask.

## `AGENTS.md`

[`AGENTS.md`](https://github.com/Olovyannikov/effector-lexical/blob/main/AGENTS.md)
at the repo root is guidance for AI agents: repository layout, the commands to
run, project conventions, and gotchas — including the listener-return-`void`
rule (Lexical `register*` listeners must not return a value the model would treat
as a teardown).

## Bundled effector skills

Alongside the library skill, the repo bundles upstream effector skills so agents
get consistent effector guidance:

- [`.claude/skills/effectorjs`](https://github.com/Olovyannikov/effector-lexical/tree/main/.claude/skills/effectorjs)
- [`.claude/skills/effector-storage`](https://github.com/Olovyannikov/effector-lexical/tree/main/.claude/skills/effector-storage)
- [`.claude/skills/patronum`](https://github.com/Olovyannikov/effector-lexical/tree/main/.claude/skills/patronum)

## Practical tip

When you ask any LLM to write `effector-lexical` code, give it the source of
truth up front: point it at the
[`llms-full.txt`](https://olovyannikov.github.io/effector-lexical/llms-full.txt)
URL, or paste the contents of
[`SKILL.md`](https://github.com/Olovyannikov/effector-lexical/blob/main/.claude/skills/effector-lexical/SKILL.md)
into the conversation. Either grounds the model in the real API and conventions.

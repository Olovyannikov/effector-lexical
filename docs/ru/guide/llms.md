# Работа с LLM

Этот проект включает первоклассный инструментарий для LLM и кодовых агентов,
чтобы получать корректный код `effector-lexical` с минимумом ручной правки.

## `llms.txt` и `llms-full.txt`

С сайта документации отдаются два машиночитаемых файла:

- <https://olovyannikov.github.io/effector-lexical/llms.txt>
- <https://olovyannikov.github.io/effector-lexical/llms-full.txt>

Они лежат в [`docs/public/`](https://github.com/Olovyannikov/effector-lexical/tree/main/docs/public)
и публикуются как есть.

[`llms.txt`](https://github.com/Olovyannikov/effector-lexical/blob/main/docs/public/llms.txt)
следует [соглашению llms.txt](https://llmstxt.org/): это лаконичный, насыщенный
ссылками Markdown-индекс, направляющий LLM к наиболее релевантной документации.
Это карта, а не сама территория — агент читает его, чтобы решить, что запросить
дальше.

[`llms-full.txt`](https://github.com/Olovyannikov/effector-lexical/blob/main/docs/public/llms-full.txt)
идёт дальше: он встраивает сжатый полный API и ключевые рецепты, так что LLM
может получить всё, что предлагает библиотека, за один запрос — без
дополнительных обращений.

## Скилл Claude Code

Скилл Claude Code находится по пути
[`.claude/skills/effector-lexical/SKILL.md`](https://github.com/Olovyannikov/effector-lexical/blob/main/.claude/skills/effector-lexical/SKILL.md).
Он учит агента, как на самом деле пользоваться библиотекой: `createEditorModel`,
`EditorProvider`, привязка команд, подключение `scope` и правила жизненного
цикла. Когда вы работаете в репозитории через Claude Code, он подгружается
автоматически, поэтому агент уже знает соглашения до того, как вы его попросите.

## `AGENTS.md`

[`AGENTS.md`](https://github.com/Olovyannikov/effector-lexical/blob/main/AGENTS.md)
в корне репозитория — это руководство для ИИ-агентов: структура репозитория,
команды для запуска, соглашения проекта и подводные камни, включая правило
возврата `void` из листенеров (листенеры Lexical `register*` не должны возвращать
значение, которое модель приняла бы за функцию очистки).

## Встроенные скиллы effector

Помимо скилла библиотеки, репозиторий включает оригинальные скиллы effector,
чтобы агенты получали согласованные рекомендации по effector:

- [`.claude/skills/effectorjs`](https://github.com/Olovyannikov/effector-lexical/tree/main/.claude/skills/effectorjs)
- [`.claude/skills/effector-storage`](https://github.com/Olovyannikov/effector-lexical/tree/main/.claude/skills/effector-storage)
- [`.claude/skills/patronum`](https://github.com/Olovyannikov/effector-lexical/tree/main/.claude/skills/patronum)

## Практический совет

Когда просите любую LLM написать код `effector-lexical`, сразу дайте ей источник
истины: укажите URL
[`llms-full.txt`](https://olovyannikov.github.io/effector-lexical/llms-full.txt)
или вставьте содержимое
[`SKILL.md`](https://github.com/Olovyannikov/effector-lexical/blob/main/.claude/skills/effector-lexical/SKILL.md)
в диалог. И то, и другое заземляет модель на реальном API и соглашениях.

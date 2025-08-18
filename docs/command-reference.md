# Task Master Command Reference

Here's a comprehensive reference of all available commands:

## Parse PRD

```bash
# Parse a PRD file and generate tasks
taskgarage parse-prd <prd-file.txt>

# Limit the number of tasks generated (default is 10)
taskgarage parse-prd <prd-file.txt> --num-tasks=5

# Allow task master to determine the number of tasks based on complexity
taskgarage parse-prd <prd-file.txt> --num-tasks=0
```

## List Tasks

```bash
# List all tasks
taskgarage list

# List tasks with a specific status
taskgarage list --status=<status>

# List tasks with subtasks
taskgarage list --with-subtasks

# List tasks with a specific status and include subtasks
taskgarage list --status=<status> --with-subtasks
```

## Show Next Task

```bash
# Show the next task to work on based on dependencies and status
taskgarage next
```

## Show Specific Task

```bash
# Show details of a specific task
taskgarage show <id>
# or
taskgarage show --id=<id>

# View multiple tasks with comma-separated IDs
taskgarage show 1,3,5
taskgarage show 44,55

# View a specific subtask (e.g., subtask 2 of task 1)
taskgarage show 1.2

# Mix parent tasks and subtasks
taskgarage show 44,44.1,55,55.2
```

**Multiple Task Display:**

- **Single ID**: Shows detailed task view with full implementation details
- **Multiple IDs**: Shows compact summary table with interactive action menu
- **Action Menu**: Provides copy-paste ready commands for batch operations:
  - Mark all as in-progress/done
  - Show next available task
  - Expand all tasks (generate subtasks)
  - View dependency relationships
  - Generate task files

## Update Tasks

```bash
# Update tasks from a specific ID and provide context
taskgarage update --from=<id> --prompt="<prompt>"

# Update tasks using research role
taskgarage update --from=<id> --prompt="<prompt>" --research
```

## Update a Specific Task

```bash
# Update a single task by ID with new information
taskgarage update-task --id=<id> --prompt="<prompt>"

# Use research-backed updates
taskgarage update-task --id=<id> --prompt="<prompt>" --research
```

## Update a Subtask

```bash
# Append additional information to a specific subtask
taskgarage update-subtask --id=<parentId.subtaskId> --prompt="<prompt>"

# Example: Add details about API rate limiting to subtask 2 of task 5
taskgarage update-subtask --id=5.2 --prompt="Add rate limiting of 100 requests per minute"

# Use research-backed updates
taskgarage update-subtask --id=<parentId.subtaskId> --prompt="<prompt>" --research
```

Unlike the `update-task` command which replaces task information, the `update-subtask` command _appends_ new information to the existing subtask details, marking it with a timestamp. This is useful for iteratively enhancing subtasks while preserving the original content.

## Generate Task Files

```bash
# Generate individual task files from tasks.json
taskgarage generate
```

## Set Task Status

```bash
# Set status of a single task
taskgarage set-status --id=<id> --status=<status>

# Set status for multiple tasks
taskgarage set-status --id=1,2,3 --status=<status>

# Set status for subtasks
taskgarage set-status --id=1.1,1.2 --status=<status>
```

When marking a task as "done", all of its subtasks will automatically be marked as "done" as well.

## Expand Tasks

```bash
# Expand a specific task with subtasks
taskgarage expand --id=<id> --num=<number>

# Expand a task with a dynamic number of subtasks (ignoring complexity report)
taskgarage expand --id=<id> --num=0

# Expand with additional context
taskgarage expand --id=<id> --prompt="<context>"

# Expand all pending tasks
taskgarage expand --all

# Force regeneration of subtasks for tasks that already have them
taskgarage expand --all --force

# Research-backed subtask generation for a specific task
taskgarage expand --id=<id> --research

# Research-backed generation for all tasks
taskgarage expand --all --research
```

## Clear Subtasks

```bash
# Clear subtasks from a specific task
taskgarage clear-subtasks --id=<id>

# Clear subtasks from multiple tasks
taskgarage clear-subtasks --id=1,2,3

# Clear subtasks from all tasks
taskgarage clear-subtasks --all
```

## Analyze Task Complexity

```bash
# Analyze complexity of all tasks
taskgarage analyze-complexity

# Save report to a custom location
taskgarage analyze-complexity --output=my-report.json

# Use a specific LLM model
taskgarage analyze-complexity --model=claude-3-opus-20240229

# Set a custom complexity threshold (1-10)
taskgarage analyze-complexity --threshold=6

# Use an alternative tasks file
taskgarage analyze-complexity --file=custom-tasks.json

# Use Perplexity AI for research-backed complexity analysis
taskgarage analyze-complexity --research
```

## View Complexity Report

```bash
# Display the task complexity analysis report
taskgarage complexity-report

# View a report at a custom location
taskgarage complexity-report --file=my-report.json
```

## Managing Task Dependencies

```bash
# Add a dependency to a task
taskgarage add-dependency --id=<id> --depends-on=<id>

# Remove a dependency from a task
taskgarage remove-dependency --id=<id> --depends-on=<id>

# Validate dependencies without fixing them
taskgarage validate-dependencies

# Find and fix invalid dependencies automatically
taskgarage fix-dependencies
```

## Move Tasks

```bash
# Move a task or subtask to a new position
taskgarage move --from=<id> --to=<id>

# Examples:
# Move task to become a subtask
taskgarage move --from=5 --to=7

# Move subtask to become a standalone task
taskgarage move --from=5.2 --to=7

# Move subtask to a different parent
taskgarage move --from=5.2 --to=7.3

# Reorder subtasks within the same parent
taskgarage move --from=5.2 --to=5.4

# Move a task to a new ID position (creates placeholder if doesn't exist)
taskgarage move --from=5 --to=25

# Move multiple tasks at once (must have the same number of IDs)
taskgarage move --from=10,11,12 --to=16,17,18
```

## Add a New Task

```bash
# Add a new task using AI (main role)
taskgarage add-task --prompt="Description of the new task"

# Add a new task using AI (research role)
taskgarage add-task --prompt="Description of the new task" --research

# Add a task with dependencies
taskgarage add-task --prompt="Description" --dependencies=1,2,3

# Add a task with priority
taskgarage add-task --prompt="Description" --priority=high
```

## Tag Management

Task Master supports tagged task lists for multi-context task management. Each tag represents a separate, isolated context for tasks.

```bash
# List all available tags with task counts and status
taskgarage tags

# List tags with detailed metadata
taskgarage tags --show-metadata

# Create a new empty tag
taskgarage add-tag <tag-name>

# Create a new tag with a description
taskgarage add-tag <tag-name> --description="Feature development tasks"

# Create a tag based on current git branch name
taskgarage add-tag --from-branch

# Create a new tag by copying tasks from the current tag
taskgarage add-tag <new-tag> --copy-from-current

# Create a new tag by copying from a specific tag
taskgarage add-tag <new-tag> --copy-from=<source-tag>

# Switch to a different tag context
taskgarage use-tag <tag-name>

# Rename an existing tag
taskgarage rename-tag <old-name> <new-name>

# Copy an entire tag to create a new one
taskgarage copy-tag <source-tag> <target-tag>

# Copy a tag with a description
taskgarage copy-tag <source-tag> <target-tag> --description="Copied for testing"

# Delete a tag and all its tasks (with confirmation)
taskgarage delete-tag <tag-name>

# Delete a tag without confirmation prompt
taskgarage delete-tag <tag-name> --yes
```

**Tag Context:**
- All task operations (list, show, add, update, etc.) work within the currently active tag
- Use `--tag=<name>` flag with most commands to operate on a specific tag context
- Tags provide complete isolation - tasks in different tags don't interfere with each other

## Initialize a Project

```bash
# Initialize a new project with Task Master structure
taskgarage init

# Initialize a new project applying specific rules
taskgarage init --rules cursor,windsurf,vscode
```

- The `--rules` flag allows you to specify one or more rule profiles (e.g., `cursor`, `roo`, `windsurf`, `cline`) to apply during initialization.
- If omitted, all available rule profiles are installed by default (claude, cline, codex, cursor, roo, trae, vscode, windsurf).
- You can use multiple comma-separated profiles in a single command.

## Manage Rules

```bash
# Add rule profiles to your project
# (e.g., .roo/rules, .windsurf/rules)
taskgarage rules add <profile1,profile2,...>

# Remove rule sets from your project
taskgarage rules remove <profile1,profile2,...>

# Remove rule sets bypassing safety check (dangerous)
taskgarage rules remove <profile1,profile2,...> --force

# Launch interactive rules setup to select rules
# (does not re-initialize project or ask about shell aliases)
taskgarage rules setup
```

- Adding rules creates the profile and rules directory (e.g., `.roo/rules`) and copies/initializes the rules.
- Removing rules deletes the profile and rules directory and associated MCP config.
- **Safety Check**: Attempting to remove rule profiles will trigger a critical warning requiring confirmation. Use `--force` to bypass.
- You can use multiple comma-separated rules in a single command.
- The `setup` action launches an interactive prompt to select which rules to apply. The list of rules is always current with the available profiles, and no manual updates are needed. This command does **not** re-initialize your project or affect shell aliases; it only manages rules interactively.

**Examples:**

```bash
taskgarage rules add windsurf,roo,vscode
taskgarage rules remove windsurf
taskgarage rules setup
```

### Interactive Rules Setup

You can launch the interactive rules setup at any time with:

```bash
taskgarage rules setup
```

This command opens a prompt where you can select which rule profiles (e.g., Cursor, Roo, Windsurf) you want to add to your project. This does **not** re-initialize your project or ask about shell aliases; it only manages rules.

- Use this command to add rule profiles interactively after project creation.
- The same interactive prompt is also used during `init` if you don't specify rules with `--rules`.

## Configure AI Models

```bash
# View current AI model configuration and API key status
taskgarage models

# Set the primary model for generation/updates (provider inferred if known)
taskgarage models --set-main=claude-3-opus-20240229

# Set the research model
taskgarage models --set-research=sonar-pro

# Set the fallback model
taskgarage models --set-fallback=claude-3-haiku-20240307

# Set a custom Ollama model for the main role
taskgarage models --set-main=my-local-llama --ollama

# Set a custom OpenRouter model for the research role
taskgarage models --set-research=google/gemini-pro --openrouter

# Run interactive setup to configure models, including custom ones
taskgarage models --setup
```

Configuration is stored in `.taskmaster/config.json` in your project root (legacy `.taskmasterconfig` files are automatically migrated). API keys are still managed via `.env` or MCP configuration. Use `taskgarage models` without flags to see available built-in models. Use `--setup` for a guided experience.

State is stored in `.taskmaster/state.json` in your project root. It maintains important information like the current tag. Do not manually edit this file.

## Research Fresh Information

```bash
# Perform AI-powered research with fresh, up-to-date information
taskgarage research "What are the latest best practices for JWT authentication in Node.js?"

# Research with specific task context
taskgarage research "How to implement OAuth 2.0?" --id=15,16

# Research with file context for code-aware suggestions
taskgarage research "How can I optimize this API implementation?" --files=src/api.js,src/auth.js

# Research with custom context and project tree
taskgarage research "Best practices for error handling" --context="We're using Express.js" --tree

# Research with different detail levels
taskgarage research "React Query v5 migration guide" --detail=high

# Disable interactive follow-up questions (useful for scripting, is the default for MCP)
# Use a custom tasks file location
taskgarage research "How to implement this feature?" --file=custom-tasks.json

# Research within a specific tag context
taskgarage research "Database optimization strategies" --tag=feature-branch

# Save research conversation to .taskmaster/docs/research/ directory (for later reference)
taskgarage research "Database optimization techniques" --save-file

# Save key findings directly to a task or subtask (recommended for actionable insights)
taskgarage research "How to implement OAuth?" --save-to=15
taskgarage research "API optimization strategies" --save-to=15.2

# Combine context gathering with automatic saving of findings
taskgarage research "Best practices for this implementation" --id=15,16 --files=src/auth.js --save-to=15.3
```

**The research command is a powerful exploration tool that provides:**

- **Fresh information beyond AI knowledge cutoffs**
- **Project-aware context** from your tasks and files
- **Automatic task discovery** using fuzzy search
- **Multiple detail levels** (low, medium, high)
- **Token counting and cost tracking**
- **Interactive follow-up questions** for deep exploration
- **Flexible save options** (commit findings to tasks or preserve conversations)
- **Iterative discovery** through continuous questioning and refinement

**Use research frequently to:**

- Get current best practices before implementing features
- Research new technologies and libraries
- Find solutions to complex problems
- Validate your implementation approaches
- Stay updated with latest security recommendations

**Interactive Features (CLI):**

- **Follow-up questions** that maintain conversation context and allow deep exploration
- **Save menu** during or after research with flexible options:
  - **Save to task/subtask**: Commit key findings and actionable insights (recommended)
  - **Save to file**: Preserve entire conversation for later reference if needed
  - **Continue exploring**: Ask more follow-up questions to dig deeper
- **Automatic file naming** with timestamps and query-based slugs when saving conversations

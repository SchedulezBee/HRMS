# Project Rule Book

Last updated: 2026-04-16

## Purpose

This rule book defines the mandatory workflow, documentation, UI behavior, and module handoff rules for this project.

These rules apply to all future work in this project folder unless the user explicitly replaces them.

## Workflow Rules

1. Every task must start from the correct engineer role based on the approved role notes in `C:\Users\Administrator\Documents\Projects\Project\Engineers`.
2. Each function, feature, or module must be initiated through its associated engineer role instead of jumping straight into implementation.
3. After completing any assigned task or phase, the next action must be requested from the Orchestrator. Do not continue blindly into the next phase.
4. No role may go beyond its defined scope in the engineer notes.
5. If required information is missing, it must be documented as a gap, assumption, or open question before proceeding.

## Product Owner Documentation Rule

1. Before any work starts, once the Product Owner gives the task, that task must be documented in this project folder.
2. The documented note must clearly state:
   - business goal
   - current scope
   - out-of-scope items
   - phase or MVP intent
   - open questions or assumptions
3. Development work should not start until the Product Owner task note exists in the project folder.

## UI and UX Rules

1. Do not use old-style text-heavy application patterns as the default design direction.
2. Use a modern application style with clear visual hierarchy and appropriate icon or emoji-supported cues where suitable.
3. UI choices must still remain practical, readable, and aligned with workflow clarity.
4. Success, error, warning, and similar feedback must appear in a centered popup or modal-style message on the screen rather than only as inline page text.
5. The same centered popup rule applies to create, update, delete, validation, and failure feedback unless the user approves an exception.

## Debug and Error Visibility Rules

1. Debug visibility must be enabled during development so errors are traceable.
2. Error messages should help identify what the issue refers to instead of failing silently.
3. Logging and error surfaces should make it easier to diagnose module, field, or workflow failures.
4. If an environment later requires reduced debug exposure for production, that must be explicitly approved as a separate decision.

## Module Completion Rules

1. Every completed module must include a usage document in the project folder.
2. The module usage document must explain:
   - what the module does
   - who uses it
   - how to access it
   - how to complete the main workflow
   - important validations, edge cases, and known limitations
3. A module is not considered fully handed off unless its usage documentation exists.

## Enforcement Rule

If there is any conflict between ad hoc execution and this rule book, follow this rule book and return control to the Orchestrator for the next instruction.

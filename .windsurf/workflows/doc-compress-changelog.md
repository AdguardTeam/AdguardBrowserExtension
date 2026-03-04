---
description: Compress the Unreleased section in CHANGELOG.md by validating relevance and consolidating entries (v1.5.0)
---

# Compress Changelog Unreleased Section

This workflow validates and compresses the `## [Unreleased]` section in `CHANGELOG.md`.

## Steps

1. **Read the current CHANGELOG.md**
   - Open and review the entire `## [Unreleased]` section
   - Identify all entries under `### Added`, `### Changed`, `### Fixed`, and `### Removed`

2. **Validate each entry against current codebase**
   For each changelog entry:
   - Search the codebase to verify the feature/file/component still exists
   - Check if referenced files, functions, classes, or environment variables are present
   - Mark entries as **valid** (still relevant) or **obsolete** (no longer applies)

   Examples of obsolete entries:
   - References to files that were deleted or renamed
   - Features that were reverted or replaced
   - Environment variables that no longer exist
   - Intermediate implementation steps that were superseded

3. **Remove obsolete entries**
   - Delete any entries that reference code/features no longer in the codebase
   - If an entire subsection becomes empty after removal, delete the subsection header too

4. **Merge duplicate subsections**
   - Check for duplicate `### Added`, `### Changed`, `### Fixed`, or `### Removed` headers
   - Under `## [Unreleased]` there must be at most ONE of each subsection
   - If duplicates exist, merge all entries under a single header
   - Preserve the standard order: Added → Changed → Fixed → Removed

5. **Identify entries that can be consolidated**
   Look for:
   - Multiple entries describing the same feature added incrementally
   - Entries that describe sub-parts of a larger feature
   - Sequential additions to the same component/service
   - Related environment variables that can be grouped

6. **Consolidate related entries**
   Merge related entries into single, comprehensive entries:
   - Combine incremental feature additions into one entry describing the complete feature
   - Group related environment variables together
   - Preserve all important details while eliminating redundancy
   - Use nested bullet points for sub-features when appropriate

7. **Verify the compressed changelog**
   - Ensure no important information was lost
   - Check that the compressed entries are clear and complete
   - Verify markdown formatting is correct

8. **Apply the changes**
   - Edit `CHANGELOG.md` with the compressed Unreleased section
   - Run the project's lint/format commands as documented in `AGENTS.md`
     (Build And Test Commands section) to verify formatting

## Guidelines

- **Preserve meaning**: Never remove information about features that still exist
- **Be concise**: Aim to reduce entry count by 30-50% through consolidation
- **Maintain structure**: Keep the standard subsections (Added, Changed, Fixed, Removed)
- **Use clear language**: Consolidated entries should be self-explanatory
- **Group logically**: Combine by feature/phase, not arbitrarily

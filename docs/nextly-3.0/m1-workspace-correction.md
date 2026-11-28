# Nextly 3.0 · M1 workspace correction

## Problem and product invariant

Nextly must maintain a traceable, project-scoped set of decisions and the business objects those decisions affect. Development stages are a method of work, not the ownership hierarchy of data or a forced page sequence.

The previous implementation combined two state systems (a browser-local AquaPure mock and the real SQLite project), exposed the persistence hierarchy directly as a navigation hierarchy, and treated version confirmation as a business approval. These are failures of context, information architecture and decision semantics, not merely styling.

## Correction

- The default route opens the real project library. The legacy demo is separate, with its own provider and entry at /demo. Its mock assistant and reset action do not appear in real projects.
- The project ID in the route identifies the current workspace. A real project's product matrix, files and review records are all scoped by that ID.
- The matrix is the entry for product development. It groups concepts and compares current versions of variants using configuration, target price, open issues, risks and version status. The editable draft takes precedence over the confirmed version when present; counts explicitly distinguish drafts and confirmed versions.
- A version editor is addressed by both project and version IDs and rejects mismatched ownership. Product, variant and version selection are available from the same editor. Legacy concept/variant/version URLs resolve to the new canonical pages.
- The editor opens in reading mode. Editing a section is explicit, with save and cancel actions. Confirmation and export are disabled while editing. Section switches prompt before discarding unsaved work; normal navigation between workspace pages uses full document navigation with beforeunload protection. Browser prompts are a fallback, not an autosave guarantee.
- Confirmation records a definition snapshot and user-supplied rationale, not a launch or production approval. A revision is cloned from the latest version of its variant.
- Experience steps select saved BOM items by name and code. Saving a BOM preserves relationships for surviving item codes and rejects removing a referenced code until its experience relationship is removed. No schema migration is needed.
- The files view and review view read actual project data. Market research, evidence/finding, sample verification and a real contextual AI assistant remain future modules and are not shown as working local functionality.

## Local acceptance

1. Open the project library; verify no demo stages, fake status dots, demo reset or simulated AI assistant.
2. Open an imported project with multiple concepts and variants; compare current configurations and prices in one view.
3. Open a definition, switch product/variant/version in place, and verify the project context remains correct.
4. Edit one section, attempt to switch before saving, cancel the switch, save and refresh; confirm values persist.
5. Confirm a draft with rationale; verify read-only snapshot and review record. Create a revision, check prior version remains unchanged.
6. Save BOM with an existing experience relationship; verify the relationship survives. Attempt to remove a referenced item and verify the request is rejected until the experience is updated.
7. Verify project files and backup/restore still work; verify legacy demo stays separate.
8. Test on the user's Windows installation, including browser back/refresh and long Chinese text. CI builds are not equivalent to browser acceptance.

## Boundaries

No schema changes, production deployment or merge to the default branch. The frontend still uses M1 section-level APIs; comprehensive cross-section transactions, rich version diffs, project research and validation workspaces are out of this correction. Imported business data remains on the user's machine. Previously lost BOM links cannot be reconstructed by this fix.

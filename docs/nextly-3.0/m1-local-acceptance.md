# Nextly 3.0 · M1 Local Acceptance Guide

**Purpose:** Verify the M1 product-definition vertical slice on the user's Windows machine.  
**Target branch:** nextly-3.0-local-first  
**Status:** CI passed; local acceptance not yet performed.

## 1. Before switching branches

If the current Nextly installation already contains useful local data:

1. Start the currently working version of Nextly.
2. Open **数据与备份** and create a fresh backup.
3. Download the backup and keep a separate copy outside the Nextly data directory.
4. Stop the local API before switching branches or replacing application files.

For a fresh installation, skip the backup step.

## 2. Update the working copy

In PowerShell, open the local Nextly repository:

~~~powershell
git fetch origin
git checkout nextly-3.0-local-first
git pull origin nextly-3.0-local-first
~~~

Install backend and frontend dependencies:

~~~powershell
npm run install:backend
npm run install:frontend
~~~

Apply database migrations:

~~~powershell
npm run db:upgrade
npm run db:current
~~~

The current migration head should be 0002_product_definition.

## 3. Start Nextly

Open two PowerShell terminals from the repository root.

Terminal A — local API:

~~~powershell
npm run dev:backend
~~~

Terminal B — frontend:

~~~powershell
npm run dev
~~~

Open http://127.0.0.1:5173.

The local API should be available at http://127.0.0.1:8000/api/health.

## 4. M1 functional acceptance

### Project and Concept

- Create a Project.
- Open its **产品定义** workspace.
- Create two Concepts under the same Project.
- Refresh the browser and confirm both Concepts remain.

### Variant and Version

- Open a Concept and create Scheme A and Scheme B.
- Open Scheme A and create v1 Draft.
- Create a v1 Draft for Scheme B.
- Confirm the two Variants have independent version histories.

### Product definition content

In Scheme A v1, enter and save:

- Product basics and positioning.
- At least one persona with functional, emotional and social needs.
- At least one requirement with source, priority, validation method and acceptance criteria.
- At least one development issue.
- An experience flow with at least one step.
- A hierarchical BOM with a parent and child item.
- One supplier quotation.
- One quality / compliance criterion.
- One product risk.

Save each section, refresh the browser and confirm the content remains.

### Product files

- Upload one product image or reference document in **产品资料**.
- Confirm it appears in the current Version.
- Download it.
- Remove its Version association and confirm the original Project file remains in the file library.

### Confirmation and version history

- Confirm Scheme A v1.
- Confirm its fields become read-only.
- Return to the Variant history and create v2.
- Confirm v2 starts with the v1 content.
- Change the product name, one requirement and one BOM item.
- Open **查看版本差异** and verify the changes are listed.
- Confirm v2.
- Return to v1 and verify its original values remain unchanged.

### Workbook export

- Export v1 and v2 separately.
- Open both .xlsx files.
- Confirm the workbook contains separate sheets for product definition, personas, requirements, development issues, experience flows, BOM, supplier quotes, quality / compliance, risks and review decisions.

## 5. Backup and restore acceptance

1. Create a backup from **数据与备份**.
2. Create a temporary Project after the backup.
3. Prepare restore from the earlier backup.
4. Stop the local API completely.
5. Run the generated command from the repository root, for example:

~~~powershell
npm run db:restore -- --staged-id <staged-id>
~~~

6. Restart the API and frontend.
7. Confirm the temporary Project is gone and pre-backup records and files are restored.
8. Confirm a safety backup of the pre-restore state exists.

Do not execute the restore command while the local API is running.

## 6. Acceptance record

Record the following after the local run:

- Windows version and Python / Node versions.
- Whether database migration completed.
- Whether Project → Concept → Variant → Version navigation worked.
- Whether every section survived refresh and API restart.
- Whether version confirmation and cloning preserved history.
- Whether the workbook opened correctly.
- Whether product file links and original files remained intact.
- Whether backup and restore completed.
- Any UI layout issues, API errors or unexpected behavior.

M1 should be marked locally accepted only after the above checks are complete.

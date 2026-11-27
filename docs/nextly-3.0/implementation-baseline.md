# Nextly 3.0 · Local-first Architecture & Delivery Baseline

**Status:** M0 backend scaffold and CI smoke tests passed; local Windows verification and backup/restore remain pending  
**Base branch:** nextly-workflow-refresh  
**Working branch:** nextly-3.0-local-first  
**Architecture decision:** Local-first, single-user, local API + SQLite + local file storage

## 1. Product and architecture boundaries

Nextly 3.0 retains the Nextly 2.0 React + Vite interface and replaces the demo-only data layer incrementally.

- Frontend: React 18 + TypeScript + Vite.
- Local application API: FastAPI, bound to 127.0.0.1 only.
- Database: SQLite, managed with SQLAlchemy 2.0 and Alembic.
- Files: local filesystem; SQLite stores relative path, metadata and SHA-256 only.
- Data analysis: pandas / openpyxl will be introduced with the research-import phase.
- AI: provider adapters and agent execution records are deferred until the business data model is stable.

The browser UI is a client of the local API. It must not write business entities directly to localStorage. localStorage may be used for non-authoritative presentation preferences only.

## 2. Confirmed domain model

### 2.1 Concept / Variant / Version

- Concept: a product idea or product family, such as “露营奇妙夜”.
- Variant: a concrete solution alternative under one Concept, such as Scheme A and Scheme B.
- Version: a revision snapshot of one Variant. Any confirmed version is immutable; subsequent edits create a new Draft based on the previous confirmed version.

The UI should distinguish the selected Variant from the current working Version.

### 2.2 Evidence and Finding

Evidence stores source material: review excerpts, BSR records, competitor listings, supplier quotations, test reports, user notes and external references.

Finding stores an interpreted statement: fact, insight, trend, conclusion or hypothesis.

Evidence and Finding are independent entities. Many-to-many link tables express support, challenge or context relationships. AI-created Findings start as proposed; human review can confirm, reject or supersede them.

### 2.3 Version-bound product content

Product Definition, personas, requirements, experience flows, experience steps, BOM items and product assets belong to a specific Variant Version.

Experience steps and BOM items may be linked only when they share the same Version. This prevents a gameplay or assembly flow from silently referencing parts from another revision.

### 2.4 Product State

Product State is a read model assembled by the API. It is not a second source of truth and is not stored as a giant JSON document.

The aggregate includes project metadata, active Concept / Variant, current Draft or latest Confirmed Version, research summary, open validation items, recent decisions and module freshness.

project_module_states stores only module status and invalidation metadata, not copies of business content.

## 3. Physical table groups

The full target model is introduced progressively.

| Group | Tables |
|---|---|
| Project | projects, project_module_states, files, app_settings |
| Research source | research_datasets, dataset_records, evidence_items |
| Research interpretation | research_findings, finding_evidence_links |
| Needs and opportunities | consumer_needs, consumer_need_dimensions, need_evidence_links, product_opportunities, opportunity_need_links, opportunity_finding_links |
| Concept model | product_concepts, concept_opportunity_links, product_variants, variant_versions |
| Product definition | product_definition_templates, product_definitions, product_personas, product_requirements, requirement_evidence_links, requirement_finding_links |
| Experience and BOM | experience_flows, experience_steps, bom_items, experience_step_bom_links, bom_item_quotes |
| Product assets | product_assets |
| Validation and decision | validation_tasks, validation_results, validation_evidence_links, decisions, decision_version_links, decision_evidence_links |
| Runtime and audit | agent_runs, activity_logs |

### Cost data rule

BOM item specification and supplier quotation are different facts.

- BOM item may hold a planning estimate and estimate currency.
- Supplier quotes belong in bom_item_quotes, with supplier, price, currency, MOQ, lead time, validity and source file.
- The selected quotation is resolved through quote_status. Do not maintain duplicate supplier / quote date / quote price fields in both tables.

### Version immutability rule

After a Version is confirmed, normal update endpoints must reject changes to its business content. The user edits by creating a new Draft Version. Historical Versions remain readable and exportable.

## 4. M0 implementation status

### Committed to this branch

- FastAPI application entry point and local-only host command.
- SQLite engine with foreign-key enforcement and busy timeout.
- OS-specific application data directory using platformdirs.
- SQLAlchemy models for Project, ProjectModuleState, FileAsset and AppSetting.
- Alembic initial migration.
- Project create / list / read / update / archive endpoints.
- File upload / list / download endpoints with SHA-256 metadata and a 100 MB upload limit.
- Filename normalization and storage-path containment checks.
- Vite proxy from /api to 127.0.0.1:8000.
- Root scripts for backend installation, API startup, database migration and backend tests.
- GitHub Actions checks for backend and frontend.

### CI verification

GitHub Actions run for commit ccfa4a571921d5d2098e5c6afb1be2c087fc94dd completed successfully:

- Backend editable package installation passed.
- Alembic initial migration passed in an isolated test data directory.
- Four API smoke tests passed: health, Project CRUD/archive, file upload/list/download/path sanitization, and persistence across application restart.
- React + Vite production build passed.

Run: https://github.com/yfy1115955678-design/Nextly/actions/runs/45932425018

### Remaining M0 work

- Run the setup on the user's Windows machine and verify the local data directory.
- Implement SQLite online backup plus coordinated storage backup and restore.
- Add frontend Project CRUD and replace the hard-coded project switcher.
- Add an explicit file-size limit test and backup/restore integration tests.
- Keep the 2.0 demo workflow available until the 3.0 product-definition flow replaces it.

M0 is not considered fully accepted until local Windows verification, backup/restore and frontend Project CRUD are complete.

## 5. M1 scope: product-definition vertical slice

M1 implements one complete product-definition path before market research ingestion.

### M1 tables

- product_definition_templates
- product_concepts
- product_variants
- variant_versions
- product_definitions
- product_personas
- product_requirements
- experience_flows
- experience_steps
- bom_items
- experience_step_bom_links
- bom_item_quotes
- product_assets
- decisions
- decision_version_links

Opportunity links are deferred until M2, when Opportunity and Research entities are introduced.

### M1 API contract

| Method | Endpoint | Purpose |
|---|---|---|
| GET / POST | /api/projects/{project_id}/concepts | List / create Concept |
| GET / PATCH | /api/concepts/{concept_id} | Read / update Concept metadata |
| POST | /api/concepts/{concept_id}/variants | Create Variant |
| GET | /api/variants/{variant_id} | Read Variant and versions |
| POST | /api/variants/{variant_id}/versions | Create Draft from latest Confirmed |
| GET | /api/versions/{version_id} | Read version snapshot |
| PUT | /api/versions/{version_id}/definition | Save product definition |
| PUT | /api/versions/{version_id}/personas | Save personas |
| PUT | /api/versions/{version_id}/requirements | Save requirements |
| PUT | /api/versions/{version_id}/experience-flows | Save flows and steps |
| PUT | /api/versions/{version_id}/bom | Save BOM and quote records |
| POST | /api/versions/{version_id}/confirm | Confirm Draft and supersede previous Confirmed |
| GET | /api/projects/{project_id}/state | Return aggregated Product State |

All write operations validate project ownership and version consistency in the service layer and execute related changes in one database transaction.

### M1 acceptance criteria

- Create a Project with multiple Concepts.
- Create multiple Variants under one Concept, including A/B alternatives.
- Create a Draft v1 for each Variant.
- Save product positioning, personas and structured requirements.
- Save experience flows and steps.
- Save BOM items, nested components and supplier quotations.
- Bind each experience step to BOM items from the same Version only.
- Confirm a Draft and preserve its snapshot.
- Create v2 from v1 without overwriting v1.
- Compare v1 and v2.
- Export a selected Version to the existing product-definition spreadsheet format.
- Refresh the browser and restart the API without losing business data.

## 6. Local run commands

Create and activate a Python 3.11+ virtual environment, then install:

~~~bash
python -m pip install -e ./backend[dev]
npm --prefix webapp/frontend install
~~~

Apply migrations:

~~~bash
npm run db:upgrade
~~~

Start the API and frontend in separate terminals:

~~~bash
npm run dev:backend
npm run dev
~~~

Run backend tests:

~~~bash
npm run test:backend
~~~

The API binds to 127.0.0.1:8000. Vite serves the UI on 127.0.0.1:5173 and proxies /api requests to the API.

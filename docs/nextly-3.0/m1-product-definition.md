# Nextly 3.0 · M1 Product Definition Vertical Slice

**Status:** Implemented on branch; local desktop acceptance pending  
**Branch:** nextly-3.0-local-first  
**Scope:** Concept → Variant → Version → Product Definition → Requirements → Experience → BOM → Decision

## 1. Product objective

M1 turns the existing product-definition demo into a persistent, versioned workspace. A user can create several product concepts under one project, compare A/B solution variants, maintain a Draft version, confirm a reviewable snapshot and continue editing through a new Draft without overwriting history.

The first vertical slice focuses on product-definition work. Evidence ingestion, market research datasets and AI-generated findings are introduced in M2 after the core product entities and version rules are stable.

## 2. Domain hierarchy

### Project

The business container. It owns Concepts, source files, decisions and the aggregate Product State.

### Concept

A product idea or product family, such as “露营奇妙夜”. One Project can contain multiple Concepts.

### Variant

A concrete solution alternative under one Concept, such as Scheme A and Scheme B. Variants are compared as peers; choosing one does not delete the others.

### Version

A revision of one Variant. A Variant has at most one editable Draft at a time. Confirmed Versions are immutable. Editing a confirmed Version starts a new Draft cloned from the latest Version. Confirming the new Draft supersedes the previous confirmed snapshot without deleting it.

## 3. Version-bound product content

All content that describes a particular solution belongs to a Variant Version.

| Section | Stored content |
|---|---|
| Product basics | Product name, SKU, specification summary, category, product type, priority, planned launch |
| Positioning and commercial plan | Positioning, market entry, target price range, target contribution, pricing strategy |
| Personas | User group, characteristics, usage scenario, pain points, purchase factors, functional / emotional / social needs |
| Requirements | Requirement type, target value, unit, priority, source, validation method and acceptance criteria |
| Development issues | Feedback / issue, evidence nature, scenario, development action, conclusion and priority |
| Experience flows | Flow purpose, ordered user actions, product responses, sensory feedback and acceptance criteria |
| BOM | Hierarchical items, specification, material, process, quantity and estimated unit cost |
| Supplier quotes | Supplier, quoted price, currency, MOQ, lead time, validity, quote status and source file |
| Quality and compliance | Standard, test method, acceptance criteria, priority and status |
| Risks | Market, supply, compliance and operational risks, likelihood, impact and mitigation |
| Assets | Version-specific product images, diagrams, documents and reference files |

This structure follows the existing product-definition workbook's section logic while separating repeatable records into their own tables. The workbook examples contain filled project data, so they are references for field semantics, not blank templates to copy into the application.

## 4. Data integrity rules

1. Every Concept belongs to one Project.
2. Every Variant belongs to one Concept.
3. Every Version belongs to one Variant and has a unique sequential version number within that Variant.
4. A Variant may have at most one Draft Version.
5. Confirmed and superseded Versions are read-only.
6. A new Draft is cloned from the latest Version; prior snapshots remain unchanged.
7. Every requirement, persona, development issue, experience flow, BOM item, quality standard, risk and product asset belongs to exactly one Version.
8. BOM parent-child relationships cannot cross Versions.
9. An Experience Step may reference only BOM items from the same Version.
10. Supplier quotes belong to a BOM item and the same Version. A quote is a source fact; a BOM estimate is a planning value.
11. A Decision is immutable after creation and links to the Version it reviewed.
12. Product State is an API read model assembled from normalized records; it is not stored as a duplicated JSON blob.

## 5. Version lifecycle

~~~text
Create Variant
    ↓
Create Draft v1
    ↓
Edit product definition, personas, requirements, experience and BOM
    ↓
Review and confirm Draft
    ↓
Confirmed v1 (immutable)
    ↓
Create Draft v2 from v1
    ↓
Edit and compare v1 → v2
    ↓
Confirm Draft v2
    ↓
v1 becomes Superseded; v2 becomes Confirmed
~~~

A Draft cannot be confirmed until its product basics and at least one requirement have been saved. Confirmation and the review Decision are committed in one transaction.

## 6. API contract

| Method | Endpoint | Purpose |
|---|---|---|
| GET / POST | /api/projects/{project_id}/concepts | List / create Concepts |
| GET | /api/concepts/{concept_id}/variants | List Variants under a Concept |
| GET / PATCH | /api/concepts/{concept_id} | Read / update Concept metadata |
| POST | /api/concepts/{concept_id}/variants | Create Variant |
| GET | /api/variants/{variant_id} | Read Variant and its Versions |
| POST | /api/variants/{variant_id}/versions | Create Draft from latest Version |
| GET | /api/versions/{version_id} | Read complete Version content |
| PUT | /api/versions/{version_id}/definition | Save product basics and positioning |
| PUT | /api/versions/{version_id}/personas | Replace personas |
| PUT | /api/versions/{version_id}/requirements | Replace requirements |
| PUT | /api/versions/{version_id}/development-issues | Replace development issues |
| PUT | /api/versions/{version_id}/experience-flows | Replace flows, steps and BOM links |
| PUT | /api/versions/{version_id}/bom | Replace BOM and supplier quote records |
| PUT | /api/versions/{version_id}/quality-standards | Replace quality and compliance criteria |
| PUT | /api/versions/{version_id}/risks | Replace risk records |
| POST | /api/versions/{version_id}/confirm | Confirm Draft and create Decision |
| GET | /api/versions/{version_id}/diff | Compare with its base Version |
| POST / DELETE | /api/versions/{version_id}/assets | Link / unlink a Project file to a Version |
| GET | /api/versions/{version_id}/export | Export a structured product-definition workbook |
| GET | /api/versions/{version_id}/export | Export a structured product-definition workbook |
| GET | /api/projects/{project_id}/state | Return aggregated Product State |

All write operations validate the Version state and parent ownership in the service layer. Related writes execute in a single database transaction.

## 7. M1 acceptance criteria

- Create one Project with multiple Concepts.
- Create multiple Variants under a Concept, including A/B alternatives.
- Create and edit a Draft Version.
- Save product basics, positioning, commercial targets and personas.
- Record functional, emotional and social needs separately.
- Save requirements with priority, source, validation method and acceptance criteria.
- Save development issues and their development actions.
- Save ordered experience flows and steps.
- Save hierarchical BOM items and supplier quotations.
- Link experience steps to BOM items from the same Version only.
- Save quality / compliance criteria and risk mitigations.
- Confirm a Draft and preserve its snapshot.
- Create v2 from v1 without overwriting v1.
- Compare v1 and v2.
- Record a review Decision against the confirmed Version.
- Export the selected Version to a structured workbook.
- Refresh the browser and restart the API without losing content.

## 8. Deferred to M2

- Research dataset ingestion and record-level provenance.
- Evidence and Finding entities with support / challenge links.
- Opportunity and consumer-need mapping.
- AI-generated proposals and human review of Findings.
- Automated change-impact analysis across research and product-definition modules.

These are deliberately deferred so M1 can establish stable business entities, version ownership and human confirmation first.


## 9. Implementation notes

The M1 vertical slice is implemented in the nextly-3.0-local-first branch.

- Project management links into a real Product Workspace.
- Concepts can be created under a Project.
- Variants can be created and compared under a Concept.
- Version history supports Draft creation, immutable confirmed snapshots and version cloning.
- The editor exposes sections for product basics, personas, requirements, development issues, experience flows, BOM / supplier quotes, quality / compliance, risks and product assets.
- Project files can be uploaded and linked to a specific Version. Removing a Version link does not delete the original Project file.
- A Version can be exported to an .xlsx workbook with separate sheets for the definition, personas, requirements, issues, experience, BOM, supplier quotes, quality, risks and decisions.
- CI covers the migration, API lifecycle, cloning, cross-Version BOM references, file links and workbook export.

Local acceptance remains necessary for interaction quality, visual layout and the Windows start / backup / restore workflow.

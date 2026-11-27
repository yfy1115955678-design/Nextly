from io import BytesIO

from fastapi.testclient import TestClient
from openpyxl import load_workbook

from app.main import app


def create_project_and_variant(client: TestClient):
    project_response = client.post(
        "/api/projects",
        json={"name": "Product Definition Test", "target_market": "US"},
    )
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    concept_response = client.post(
        f"/api/projects/{project_id}/concepts",
        json={
            "code": "CON-001",
            "name": "AquaPure S1",
            "category": "Pet water fountain",
            "description": "A versioned product concept.",
        },
    )
    assert concept_response.status_code == 201
    concept_id = concept_response.json()["id"]

    variant_response = client.post(
        f"/api/concepts/{concept_id}/variants",
        json={"code": "A", "name": "Scheme A", "description": "Baseline solution."},
    )
    assert variant_response.status_code == 201
    return project_id, concept_id, variant_response.json()["id"]


def fill_version(client: TestClient, version_id: str):
    definition = client.put(
        f"/api/versions/{version_id}/definition",
        json={
            "product_name": "AquaPure S1",
            "sku": "AP-S1-A",
            "specification_summary": "3.0L pet water fountain.",
            "category": "Pet Supplies",
            "product_type": "Water fountain",
            "priority": "P0",
            "positioning": "Quiet and easy to clean.",
            "market_entry": "Mid-price US Amazon offer.",
            "target_price_min": 39.99,
            "target_price_max": 49.99,
            "target_price_currency": "USD",
            "pricing_strategy": "Value-based price band.",
            "certification_requirements": "Confirm applicable electrical and material requirements.",
            "warranty_policy": "Policy to be confirmed by the brand.",
        },
    )
    assert definition.status_code == 200

    personas = client.put(
        f"/api/versions/{version_id}/personas",
        json=[
            {
                "name": "Apartment pet owner",
                "user_group": "Urban cat owner",
                "age_range": "25–40",
                "characteristics": "Lives in an apartment and owns one or two cats.",
                "usage_scenario": "Daily water access at home.",
                "functional_needs": "Easy cleaning and reliable water circulation.",
                "emotional_needs": "Confidence that the pet has clean water.",
                "social_needs": "A product that fits the home and is easy to recommend.",
                "pain_points": "Noise, residue and difficult disassembly.",
                "purchase_decision_factors": "Quiet operation, hygiene and price.",
            }
        ],
    )
    assert personas.status_code == 200

    requirements = client.put(
        f"/api/versions/{version_id}/requirements",
        json=[
            {
                "code": "R-01",
                "requirement_type": "performance",
                "title": "Pump noise at or below 25 dB",
                "target_value": "≤25",
                "unit": "dB",
                "priority": "P0",
                "source_nature": "Market review synthesis",
                "source_reference": "VOC cluster P-01",
                "validation_method": "Noise measurement in a controlled room.",
                "acceptance_criteria": "Measured noise does not exceed 25 dB at the agreed test distance.",
            }
        ],
    )
    assert requirements.status_code == 200

    issues = client.put(
        f"/api/versions/{version_id}/development-issues",
        json=[
            {
                "issue_code": "ISS-01",
                "title": "Pump and PCB cannot be dishwasher-cleaned",
                "evidence_nature": "Engineering constraint",
                "scenario": "The initial cleaning requirement covers the entire assembly.",
                "development_action": "Separate removable wet parts from electrical components.",
                "conclusion": "Define component-level cleaning boundaries.",
                "priority": "P0",
            }
        ],
    )
    assert issues.status_code == 200

    bom = client.put(
        f"/api/versions/{version_id}/bom",
        json=[
            {
                "item_code": "SET",
                "name": "Complete fountain",
                "category": "Assembly",
                "quantity": 1,
                "unit": "set",
                "sort_order": 0,
            },
            {
                "item_code": "TANK",
                "parent_item_code": "SET",
                "name": "Water tank",
                "category": "Main part",
                "specification": "3.0L removable tank.",
                "material": "Tritan candidate",
                "process": "Injection molding",
                "quantity": 1,
                "unit": "pcs",
                "unit_cost_estimate": 2.5,
                "estimate_currency": "USD",
                "sort_order": 1,
                "quotes": [
                    {
                        "supplier_name": "Sample Factory",
                        "quoted_unit_price": 2.3,
                        "currency": "USD",
                        "moq": 500,
                        "lead_time_days": 25,
                        "quote_status": "candidate",
                        "note": "Initial indicative quote.",
                    }
                ],
            },
        ],
    )
    assert bom.status_code == 200

    flows = client.put(
        f"/api/versions/{version_id}/experience-flows",
        json=[
            {
                "name": "Daily refill and cleaning",
                "purpose": "Refill water and clean removable wet parts.",
                "steps": [
                    {
                        "sequence_no": 1,
                        "title": "Remove water tank",
                        "user_action": "Lift the tank from the base.",
                        "product_response": "Tank releases without tools.",
                        "sensory_feedback": "A clear stop indicates the tank is detached.",
                        "acceptance_criteria": "One-hand removal without accidental release.",
                        "bom_item_codes": ["TANK"],
                    }
                ],
            }
        ],
    )
    assert flows.status_code == 200

    quality = client.put(
        f"/api/versions/{version_id}/quality-standards",
        json=[
            {
                "category": "Durability",
                "requirement": "Tank withstands repeated removal and installation.",
                "test_method": "Cycle test using the agreed sample fixture.",
                "acceptance_criteria": "No cracking or loss of retention after the defined cycle count.",
                "priority": "P0",
            }
        ],
    )
    assert quality.status_code == 200

    risks = client.put(
        f"/api/versions/{version_id}/risks",
        json=[
            {
                "risk_type": "supply",
                "title": "Tritan material cost may exceed target.",
                "description": "Material quotation is not yet confirmed.",
                "likelihood": "medium",
                "impact": "high",
                "mitigation": "Compare two material grades and confirm landed cost.",
            }
        ],
    )
    assert risks.status_code == 200


def test_product_definition_version_lifecycle_and_clone():
    with TestClient(app) as client:
        project_id, concept_id, variant_id = create_project_and_variant(client)

        first_version_response = client.post(
            f"/api/variants/{variant_id}/versions",
            json={"change_summary": "Initial product definition."},
        )
        assert first_version_response.status_code == 201
        first_version = first_version_response.json()
        assert first_version["version_number"] == 1
        assert first_version["status"] == "draft"
        version_id = first_version["id"]

        second_draft = client.post(
            f"/api/variants/{variant_id}/versions",
            json={"change_summary": "This should be blocked while v1 is Draft."},
        )
        assert second_draft.status_code == 409

        fill_version(client, version_id)

        variants = client.get(f"/api/concepts/{concept_id}/variants")
        assert variants.status_code == 200
        assert len(variants.json()) == 1

        uploaded_asset = client.post(
            "/api/files/upload",
            data={"project_id": project_id},
            files={"file": ("product-overview.png", b"fake-image-data", "image/png")},
        )
        assert uploaded_asset.status_code == 201
        asset_response = client.post(
            f"/api/versions/{version_id}/assets",
            json={
                "file_id": uploaded_asset.json()["id"],
                "asset_role": "hero",
                "caption": "Product overview",
            },
        )
        assert asset_response.status_code == 201

        details = client.get(f"/api/versions/{version_id}")
        assert details.status_code == 200
        payload = details.json()
        assert payload["definition"]["product_name"] == "AquaPure S1"
        assert payload["personas"][0]["emotional_needs"]
        assert payload["personas"][0]["social_needs"]
        assert payload["bom_items"][1]["parent_item_code"] == "SET"
        assert payload["bom_items"][1]["quotes"][0]["supplier_name"] == "Sample Factory"
        assert payload["experience_flows"][0]["steps"][0]["bom_item_codes"] == ["TANK"]
        assert payload["assets"][0]["asset_role"] == "hero"

        exported = client.get(f"/api/versions/{version_id}/export")
        assert exported.status_code == 200
        workbook = load_workbook(BytesIO(exported.content), read_only=True)
        assert "产品定义" in workbook.sheetnames
        assert "用户画像" in workbook.sheetnames
        assert "供应商报价" in workbook.sheetnames
        workbook.close()

        confirmed = client.post(
            f"/api/versions/{version_id}/confirm",
            json={
                "decision_type": "conditional",
                "outcome": "Proceed to sample validation",
                "rationale": "Core product requirements are defined.",
                "impact": "Supplier sampling can begin.",
                "conditions": "Confirm formal quote and durability test.",
            },
        )
        assert confirmed.status_code == 200
        assert confirmed.json()["version"]["status"] == "confirmed"
        assert confirmed.json()["decision"]["decision_type"] == "conditional"

        immutable_update = client.put(
            f"/api/versions/{version_id}/definition",
            json={"product_name": "Overwritten v1"},
        )
        assert immutable_update.status_code == 409

        second_version_response = client.post(
            f"/api/variants/{variant_id}/versions",
            json={"change_summary": "Revise positioning and BOM."},
        )
        assert second_version_response.status_code == 201
        second_version = second_version_response.json()
        assert second_version["version_number"] == 2
        assert second_version["based_on_version_id"] == version_id
        second_id = second_version["id"]

        cloned = client.get(f"/api/versions/{second_id}").json()
        assert cloned["definition"]["product_name"] == "AquaPure S1"
        assert len(cloned["personas"]) == 1
        assert len(cloned["requirements"]) == 1
        assert len(cloned["bom_items"]) == 2
        assert len(cloned["experience_flows"][0]["steps"]) == 1
        assert len(cloned["assets"]) == 1

        revised_definition = client.put(
            f"/api/versions/{second_id}/definition",
            json={
                "product_name": "AquaPure S1 Plus",
                "sku": "AP-S1-PLUS",
                "positioning": "Quiet, easy-clean premium model.",
                "target_price_min": 44.99,
                "target_price_max": 54.99,
            },
        )
        assert revised_definition.status_code == 200

        revised_requirements = client.put(
            f"/api/versions/{second_id}/requirements",
            json=[
                {
                    "code": "R-01",
                    "requirement_type": "performance",
                    "title": "Pump noise at or below 22 dB",
                    "target_value": "≤22",
                    "unit": "dB",
                    "priority": "P0",
                    "validation_method": "Controlled-room noise measurement.",
                    "acceptance_criteria": "Measured noise does not exceed 22 dB.",
                }
            ],
        )
        assert revised_requirements.status_code == 200

        revised_bom = client.put(
            f"/api/versions/{second_id}/bom",
            json=[
                {
                    "item_code": "NEW-BASE",
                    "name": "Updated base assembly",
                    "category": "Assembly",
                    "quantity": 1,
                    "unit": "set",
                }
            ],
        )
        assert revised_bom.status_code == 200

        cross_version_link = client.put(
            f"/api/versions/{second_id}/experience-flows",
            json=[
                {
                    "name": "Invalid flow",
                    "steps": [
                        {
                            "sequence_no": 1,
                            "title": "Use the old tank",
                            "bom_item_codes": ["TANK"],
                        }
                    ],
                }
            ],
        )
        assert cross_version_link.status_code == 422

        valid_flow = client.put(
            f"/api/versions/{second_id}/experience-flows",
            json=[
                {
                    "name": "Updated assembly",
                    "steps": [
                        {
                            "sequence_no": 1,
                            "title": "Place the base",
                            "bom_item_codes": ["NEW-BASE"],
                        }
                    ],
                }
            ],
        )
        assert valid_flow.status_code == 200

        diff = client.get(f"/api/versions/{second_id}/diff")
        assert diff.status_code == 200
        assert diff.json()["base_version"]["version_number"] == 1
        assert any(item["field"] == "product_name" for item in diff.json()["definition_changes"])
        assert diff.json()["requirement_changes"]["changed"]
        assert diff.json()["bom_changes"]["added"]
        assert diff.json()["bom_changes"]["removed"]

        confirmed_v2 = client.post(
            f"/api/versions/{second_id}/confirm",
            json={
                "decision_type": "approve",
                "outcome": "Approve revised product definition v2",
                "rationale": "Updated target and requirement are reviewed.",
            },
        )
        assert confirmed_v2.status_code == 200

        historical_v1 = client.get(f"/api/versions/{version_id}").json()
        assert historical_v1["version"]["status"] == "superseded"
        assert historical_v1["definition"]["product_name"] == "AquaPure S1"

        state = client.get(f"/api/projects/{project_id}/state")
        assert state.status_code == 200
        assert state.json()["concepts"][0]["concept"]["id"] == concept_id
        assert state.json()["recent_decisions"]


def test_product_definition_validates_bom_hierarchy_and_price_range():
    with TestClient(app) as client:
        project_id, _, variant_id = create_project_and_variant(client)
        version = client.post(
            f"/api/variants/{variant_id}/versions",
            json={},
        ).json()
        version_id = version["id"]

        invalid_price = client.put(
            f"/api/versions/{version_id}/definition",
            json={
                "product_name": "Invalid Price Range",
                "target_price_min": 50,
                "target_price_max": 40,
            },
        )
        assert invalid_price.status_code == 422

        cyclic_bom = client.put(
            f"/api/versions/{version_id}/bom",
            json=[
                {
                    "item_code": "A",
                    "parent_item_code": "B",
                    "name": "Item A",
                },
                {
                    "item_code": "B",
                    "parent_item_code": "A",
                    "name": "Item B",
                },
            ],
        )
        assert cyclic_bom.status_code == 422

        other_project = client.post(
            "/api/projects",
            json={"name": "Unrelated Project"},
        )
        assert other_project.status_code == 201
        other_project_id = other_project.json()["id"]
        other_file = client.post(
            "/api/files/upload",
            data={"project_id": other_project_id},
            files={"file": ("supplier-quote.pdf", b"quote", "application/pdf")},
        )
        assert other_file.status_code == 201

        cross_project_asset = client.post(
            f"/api/versions/{version_id}/assets",
            json={"file_id": other_file.json()["id"], "asset_role": "supplier"},
        )
        assert cross_project_asset.status_code == 404

        cross_project_quote = client.put(
            f"/api/versions/{version_id}/bom",
            json=[
                {
                    "item_code": "ITEM-01",
                    "name": "Test component",
                    "quantity": 1,
                    "unit": "pcs",
                    "quotes": [
                        {
                            "supplier_name": "Unrelated supplier",
                            "source_file_id": other_file.json()["id"],
                        }
                    ],
                }
            ],
        )
        assert cross_project_quote.status_code == 422

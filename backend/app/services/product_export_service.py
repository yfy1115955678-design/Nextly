from io import BytesIO
from typing import Any

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from sqlalchemy.orm import Session

from app.services.product_service import get_version_detail


def _value(value: Any) -> Any:
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return str(value)
    return value


def _write_sheet(workbook: Workbook, title: str, headers: list[str], rows: list[list[Any]]) -> None:
    sheet = workbook.create_sheet(title=title)
    sheet.append(headers)
    for row in rows:
        sheet.append([_value(value) for value in row])

    header_fill = PatternFill(fill_type="solid", fgColor="F1F2F4")
    for cell in sheet[1]:
        cell.font = Font(name="Arial", bold=True, color="303238")
        cell.fill = header_fill
        cell.alignment = Alignment(vertical="center", wrap_text=True)

    for row in sheet.iter_rows(min_row=2):
        for cell in row:
            cell.font = Font(name="Arial", color="34363B")
            cell.alignment = Alignment(vertical="top", wrap_text=True)

    sheet.freeze_panes = "A2"
    sheet.auto_filter.ref = sheet.dimensions
    sheet.row_dimensions[1].height = 28

    for column_index, column_cells in enumerate(sheet.columns, start=1):
        longest = max((len(str(cell.value or "")) for cell in column_cells), default=10)
        sheet.column_dimensions[get_column_letter(column_index)].width = min(max(longest + 3, 14), 42)


def export_product_definition(db: Session, version_id: str) -> tuple[bytes, str]:
    detail = get_version_detail(db, version_id)
    definition = detail["definition"] or {}
    project = detail["project"]
    concept = detail["concept"]
    variant = detail["variant"]
    version = detail["version"]

    workbook = Workbook()
    overview = workbook.active
    overview.title = "产品定义"
    overview_rows = [
        ["项目", project["name"]],
        ["产品概念", concept["name"]],
        ["方案", variant["name"]],
        ["版本", f'v{version["version_number"]}'],
        ["版本状态", version["status"]],
        ["修改说明", version["change_summary"]],
        ["产品名称", definition.get("product_name", "")],
        ["SKU", definition.get("sku", "")],
        ["品类", definition.get("category", "")],
        ["产品类型", definition.get("product_type", "")],
        ["开发优先级", definition.get("priority", "")],
        ["计划上市日期", definition.get("planned_launch_date", "")],
        ["规格摘要", definition.get("specification_summary", "")],
        ["产品定位", definition.get("positioning", "")],
        ["市场切入策略", definition.get("market_entry", "")],
        ["目标价格下限", definition.get("target_price_min", "")],
        ["目标价格上限", definition.get("target_price_max", "")],
        ["价格币种", definition.get("target_price_currency", "")],
        ["目标贡献值", definition.get("target_contribution", "")],
        ["定价策略", definition.get("pricing_strategy", "")],
        ["认证与合规要求", definition.get("certification_requirements", "")],
        ["质保政策", definition.get("warranty_policy", "")],
        ["定义摘要", definition.get("summary", "")],
    ]
    overview.append(["字段", "内容"])
    for row in overview_rows:
        overview.append(row)
    _write_sheet(workbook, "用户画像", [
        "画像名称", "用户群体", "年龄范围", "用户特征", "使用场景",
        "功能性需求", "情绪性需求", "社会性需求", "用户痛点", "购买决策因素",
    ], [[
        item["name"], item["user_group"], item.get("age_range"), item["characteristics"],
        item["usage_scenario"], item["functional_needs"], item["emotional_needs"],
        item["social_needs"], item["pain_points"], item["purchase_decision_factors"],
    ] for item in detail["personas"]])

    _write_sheet(workbook, "产品需求", [
        "编号", "类型", "需求名称", "需求说明", "目标值", "单位", "优先级",
        "来源性质", "来源引用", "验证方法", "验收标准", "状态",
    ], [[
        item["code"], item["requirement_type"], item["title"], item["description"],
        item["target_value"], item.get("unit"), item["priority"], item.get("source_nature"),
        item["source_reference"], item["validation_method"], item["acceptance_criteria"],
        item["status"],
    ] for item in detail["requirements"]])

    _write_sheet(workbook, "开发问题", [
        "问题编号", "问题名称", "证据性质", "出现情境", "处理动作", "处理结论", "优先级", "状态",
    ], [[
        item.get("issue_code"), item["title"], item.get("evidence_nature"), item["scenario"],
        item["development_action"], item["conclusion"], item["priority"], item["status"],
    ] for item in detail["development_issues"]])

    flow_rows = []
    for flow_detail in detail["experience_flows"]:
        flow = flow_detail["flow"]
        for step_detail in flow_detail["steps"]:
            step = step_detail["step"]
            flow_rows.append([
                flow["name"], flow["purpose"], flow["description"], step["sequence_no"],
                step["title"], step["user_action"], step["product_response"],
                step["sensory_feedback"], step["acceptance_criteria"],
                ", ".join(step_detail["bom_item_codes"]), step["notes"],
            ])
    _write_sheet(workbook, "体验流程", [
        "流程名称", "流程目的", "流程说明", "步骤序号", "步骤名称", "用户操作",
        "产品响应", "感官反馈", "验收标准", "关联BOM编码", "备注",
    ], flow_rows)

    bom_rows = []
    quote_rows = []
    for bom_detail in detail["bom_items"]:
        item = bom_detail["item"]
        bom_rows.append([
            item.get("item_code"), bom_detail.get("parent_item_code"), item["name"],
            item.get("category"), item["specification"], item["material"], item["process"],
            item["quantity"], item["unit"], item.get("unit_cost_estimate"),
            item["estimate_currency"], item["supplier_notes"], item["is_optional"],
        ])
        for quote in bom_detail["quotes"]:
            quote_rows.append([
                item.get("item_code"), quote["supplier_name"], quote.get("supplier_part_no"),
                quote.get("quoted_unit_price"), quote["currency"], quote.get("moq"),
                quote.get("lead_time_days"), quote.get("valid_until"), quote["quote_status"],
                quote["note"], quote.get("source_file_id"),
            ])
    _write_sheet(workbook, "BOM", [
        "物料编码", "上级编码", "物料名称", "类别", "规格", "材质", "工艺",
        "数量", "单位", "成本估算", "币种", "供应商备注", "是否选配",
    ], bom_rows)
    _write_sheet(workbook, "供应商报价", [
        "物料编码", "供应商", "供应商料号", "报价单价", "币种", "MOQ",
        "交期天数", "有效期", "报价状态", "备注", "来源文件ID",
    ], quote_rows)

    _write_sheet(workbook, "质量与合规", [
        "类别", "标准要求", "测试方法", "验收条件", "优先级", "状态", "来源引用",
    ], [[
        item["category"], item["requirement"], item["test_method"], item["acceptance_criteria"],
        item["priority"], item["status"], item["source_reference"],
    ] for item in detail["quality_standards"]])

    _write_sheet(workbook, "风险管理", [
        "风险类型", "风险名称", "风险描述", "发生概率", "影响程度", "缓解措施", "责任人", "状态",
    ], [[
        item["risk_type"], item["title"], item["description"], item["likelihood"],
        item["impact"], item["mitigation"], item.get("owner"), item["status"],
    ] for item in detail["risks"]])

    _write_sheet(workbook, "评审决策", [
        "决策时间", "决策类型", "评审结论", "决策依据", "影响", "附加条件",
    ], [[
        item["decided_at"], item["decision_type"], item["outcome"], item["rationale"],
        item["impact"], item["conditions"],
    ] for item in detail["decisions"]])

    output = BytesIO()
    workbook.save(output)
    output.seek(0)
    filename = f'product-definition-{variant.get("code") or variant["id"][:8]}-v{version["version_number"]}.xlsx'
    return output.getvalue(), filename
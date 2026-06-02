import adsk.core
import adsk.fusion
import traceback
import urllib.request
import urllib.error
import json
import datetime
import os
import base64

# ─── CONFIG ────────────────────────────────────────────────────────────────────
API_ENDPOINT = "http://localhost:3000/api/fusion/log"
EXPORT_DIR = os.path.expanduser("~/Documents/ShopFusion/exports")
# ────────────────────────────────────────────────────────────────────────────────

_handlers = []
_app = None
_ui = None


def run(context):
    global _app, _ui
    try:
        _app = adsk.core.Application.get()
        _ui = _app.userInterface

        cmd_defs = _ui.commandDefinitions
        cmd_id = "ShopFusionLogCmd"

        existing = cmd_defs.itemById(cmd_id)
        if existing:
            existing.deleteMe()

        cmd_def = cmd_defs.addButtonDefinition(
            cmd_id,
            "Log to ShopFusion",
            "Captures current design or drawing and sends to ShopFusion dashboard",
        )

        on_created = CommandCreatedHandler()
        cmd_def.commandCreated.add(on_created)
        _handlers.append(on_created)

        workspace_ids = [
            ("FusionSolidEnvironment", "SolidScriptsAddinsPanel"),
            ("FusionDocumentationEnvironment", "SolidScriptsAddinsPanelDrawing"),
        ]

        for ws_id, panel_id in workspace_ids:
            ws = _ui.workspaces.itemById(ws_id)
            if ws:
                panel = ws.toolbarPanels.itemById(panel_id)
                if panel:
                    control = panel.controls.addCommand(cmd_def)
                    control.isPromotedByDefault = True
                    control.isPromoted = True

        _ui.messageBox("ShopFusion loaded!")

    except Exception:
        if _ui:
            _ui.messageBox(f"ShopFusion failed to load:\n{traceback.format_exc()}")


def stop(context):
    try:
        workspace_ids = [
            ("FusionSolidEnvironment", "SolidScriptsAddinsPanel"),
            ("FusionDocumentationEnvironment", "SolidScriptsAddinsPanelDrawing"),
        ]
        for ws_id, panel_id in workspace_ids:
            ws = _ui.workspaces.itemById(ws_id)
            if ws:
                panel = ws.toolbarPanels.itemById(panel_id)
                if panel:
                    control = panel.controls.itemById("ShopFusionLogCmd")
                    if control:
                        control.deleteMe()
        cmd_def = _ui.commandDefinitions.itemById("ShopFusionLogCmd")
        if cmd_def:
            cmd_def.deleteMe()
    except Exception:
        pass


def is_drawing():
    try:
        doc = _app.activeDocument
        return doc.objectType == "adsk::drawing::DrawingDocument"
    except Exception:
        return False


class CommandCreatedHandler(adsk.core.CommandCreatedEventHandler):
    def notify(self, args):
        try:
            cmd = args.command
            inputs = cmd.commandInputs

            doc_name = _app.activeDocument.name or ""

            inputs.addStringValueInput("partName", "Part Name", doc_name)
            inputs.addStringValueInput("jobNumber", "Job Number", "")
            inputs.addStringValueInput("componentName", "Component Name", doc_name)
            inputs.addStringValueInput("revision", "Revision", "A")
            inputs.addStringValueInput("notes", "Notes", "")

            on_execute = CommandExecuteHandler()
            cmd.execute.add(on_execute)
            _handlers.append(on_execute)

        except Exception:
            _ui.messageBox(f"ShopFusion UI error:\n{traceback.format_exc()}")


class CommandExecuteHandler(adsk.core.CommandEventHandler):
    def notify(self, args):
        try:
            inputs = args.command.commandInputs
            part_name = inputs.itemById("partName").value.strip()
            job_number = inputs.itemById("jobNumber").value.strip()
            component_name = inputs.itemById("componentName").value.strip()
            revision = inputs.itemById("revision").value.strip()
            notes = inputs.itemById("notes").value.strip()

            if not part_name:
                _ui.messageBox("Part name is required.")
                return

            if is_drawing():
                payload = build_drawing_payload(
                    part_name, job_number, component_name, revision, notes
                )
            else:
                payload = build_model_payload(
                    part_name, job_number, component_name, revision, notes
                )

            if payload is None:
                return

            success = post_to_api(payload)

            if success:
                _ui.messageBox(
                    f"✓ Logged to ShopFusion\n\n"
                    f"Part: {payload['modelName']}\n"
                    f"Type: {payload['type']}\n"
                    f"Job: {payload.get('jobNumber') or '—'}\n"
                    f"Component: {payload.get('componentName') or '—'}\n"
                    f"Revision: {payload.get('revision') or '—'}"
                )
            else:
                _ui.messageBox("Failed to reach ShopFusion API.")

        except Exception:
            _ui.messageBox(f"ShopFusion execute error:\n{traceback.format_exc()}")


def build_drawing_payload(part_name, job_number, component_name, revision, notes):
    try:
        image_data = export_drawing_as_pdf()
        sheet_size = get_sheet_size()

        return {
            "type": "DRAWING",
            "modelName": part_name,
            "jobNumber": job_number or None,
            "componentName": component_name or part_name,
            "revision": revision or None,
            "sheetSize": sheet_size,
            "notes": notes,
            "bodies": 0,
            "boundingBox": {"x": 0, "y": 0, "z": 0},
            "components": [],
            "imageData": image_data,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        }
    except Exception:
        _ui.messageBox(f"Error building drawing payload:\n{traceback.format_exc()}")
        return None


def build_model_payload(part_name, job_number, component_name, revision, notes):
    try:
        design = adsk.fusion.Design.cast(_app.activeProduct)
        if not design:
            _ui.messageBox("No active design found.")
            return None

        root = design.rootComponent
        x_max = y_max = z_max = 0.0
        body_names = []
        materials = []

        for body in root.bRepBodies:
            bb = body.boundingBox
            if bb:
                x = round(abs(bb.maxPoint.x - bb.minPoint.x) / 2.54, 4)
                y = round(abs(bb.maxPoint.y - bb.minPoint.y) / 2.54, 4)
                z = round(abs(bb.maxPoint.z - bb.minPoint.z) / 2.54, 4)
                x_max = max(x_max, x)
                y_max = max(y_max, y)
                z_max = max(z_max, z)
                body_names.append(body.name)
                try:
                    mat = body.material
                    if mat and mat.name not in materials:
                        materials.append(mat.name)
                except Exception:
                    pass

        component_names = [root.name]
        for occ in root.allOccurrences:
            name = occ.component.name
            if name and name not in component_names:
                component_names.append(name)

        material_str = ", ".join(materials) if materials else None

        return {
            "type": "MODEL",
            "modelName": part_name,
            "jobNumber": job_number or None,
            "componentName": component_name or part_name,
            "revision": revision or None,
            "sheetSize": None,
            "notes": notes,
            "material": material_str,
            "bodies": len(body_names),
            "boundingBox": {"x": x_max, "y": y_max, "z": z_max},
            "components": component_names,
            "imageData": None,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        }
    except Exception:
        _ui.messageBox(f"Error building model payload:\n{traceback.format_exc()}")
        return None


def get_sheet_size():
    try:
        doc = _app.activeDocument
        drawing = doc.drawing
        sheet = drawing.activeSheet
        size_map = {
            0: "A",
            1: "B",
            2: "C",
            3: "D",
            4: "E",
            5: "A4",
            6: "A3",
            7: "A2",
            8: "A1",
            9: "A0",
        }
        return size_map.get(sheet.sheetSize, "Unknown")
    except Exception:
        return None


def export_drawing_as_pdf():
    try:
        os.makedirs(EXPORT_DIR, exist_ok=True)

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        pdf_path = os.path.join(EXPORT_DIR, f"drawing_{timestamp}.pdf")

        doc = _app.activeDocument
        drawing = doc.drawing
        export_mgr = drawing.exportManager
        pdf_options = export_mgr.createPDFExportOptions(pdf_path)
        export_mgr.execute(pdf_options)

        with open(pdf_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    except Exception:
        _ui.messageBox(f"Export error:\n{traceback.format_exc()}")
        return None


def post_to_api(payload: dict) -> bool:
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            API_ENDPOINT,
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "ShopFusion/1.0",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            return response.status == 200

    except urllib.error.HTTPError as e:
        _ui.messageBox(f"API error {e.code}: {e.reason}")
        return False
    except urllib.error.URLError as e:
        _ui.messageBox(f"Connection error: {e.reason}")
        return False
    except Exception:
        _ui.messageBox(f"Unexpected error:\n{traceback.format_exc()}")
        return False

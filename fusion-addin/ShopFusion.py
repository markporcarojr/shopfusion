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
API_ENDPOINT = "https://f7e3-2600-6c8c-2800-b0-39c7-9727-48d3-1285.ngrok-free.app/api/fusion/log"
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

        panel_ids = [
            "SolidScriptsAddinsPanel",
            "ToolsPanel",
            "InspectPanel",
            "UtilitiesPanel",
        ]

        panel = None
        for panel_id in panel_ids:
            panel = _ui.allToolbarPanels.itemById(panel_id)
            if panel:
                break

        if panel:
            control = panel.controls.addCommand(cmd_def)
            control.isPromotedByDefault = True
            control.isPromoted = True

        _ui.messageBox("ShopFusion loaded! Find 'Log to ShopFusion' in your toolbar.")

    except Exception:
        if _ui:
            _ui.messageBox(f"ShopFusion failed to load:\n{traceback.format_exc()}")


def stop(context):
    try:
        panel_ids = [
            "SolidScriptsAddinsPanel",
            "ToolsPanel",
            "InspectPanel",
            "UtilitiesPanel",
        ]
        for panel_id in panel_ids:
            panel = _ui.allToolbarPanels.itemById(panel_id)
            if panel:
                control = panel.controls.itemById("ShopFusionLogCmd")
                if control:
                    control.deleteMe()
                break
        cmd_def = _ui.commandDefinitions.itemById("ShopFusionLogCmd")
        if cmd_def:
            cmd_def.deleteMe()
    except Exception:
        pass


def is_drawing():
    try:
        product = _app.activeProduct
        return product.productType == "DrawingProductType"
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
            revision = inputs.itemById("revision").value.strip()
            notes = inputs.itemById("notes").value.strip()

            if not part_name:
                _ui.messageBox("Part name is required.")
                return

            if is_drawing():
                payload = build_drawing_payload(part_name, job_number, revision, notes)
            else:
                payload = build_model_payload(part_name, job_number, revision, notes)

            if payload is None:
                return

            success = post_to_api(payload)

            if success:
                _ui.messageBox(
                    f"✓ Logged to ShopFusion\n\n"
                    f"Part: {payload['modelName']}\n"
                    f"Type: {payload['type']}\n"
                    f"Job: {payload.get('jobNumber') or '—'}"
                )
            else:
                _ui.messageBox("Failed to reach ShopFusion API. Is ngrok running?")

        except Exception:
            _ui.messageBox(f"ShopFusion execute error:\n{traceback.format_exc()}")


def build_drawing_payload(part_name, job_number, revision, notes):
    try:
        image_data = export_drawing_as_png()

        return {
            "type": "DRAWING",
            "modelName": part_name,
            "jobNumber": job_number or None,
            "revision": revision,
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


def build_model_payload(part_name, job_number, revision, notes):
    try:
        design = adsk.fusion.Design.cast(_app.activeProduct)
        if not design:
            _ui.messageBox("No active design found.")
            return None

        root = design.rootComponent
        x_max = y_max = z_max = 0.0
        body_names = []

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

        component_names = [root.name]
        for occ in root.allOccurrences:
            name = occ.component.name
            if name and name not in component_names:
                component_names.append(name)

        return {
            "type": "MODEL",
            "modelName": part_name,
            "jobNumber": job_number or None,
            "revision": revision,
            "notes": notes,
            "bodies": len(body_names),
            "boundingBox": {"x": x_max, "y": y_max, "z": z_max},
            "components": component_names,
            "imageData": None,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        }
    except Exception:
        _ui.messageBox(f"Error building model payload:\n{traceback.format_exc()}")
        return None


def export_drawing_as_png():
    try:
        os.makedirs(EXPORT_DIR, exist_ok=True)

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        export_path = os.path.join(EXPORT_DIR, f"drawing_{timestamp}.png")

        doc = _app.activeDocument
        export_mgr = doc.exportManager

        png_options = export_mgr.createPNGExportOptions(export_path)
        png_options.resolution = 150
        export_mgr.execute(png_options)

        with open(export_path, "rb") as f:
            image_bytes = f.read()

        return base64.b64encode(image_bytes).decode("utf-8")

    except Exception:
        _ui.messageBox(f"Export error:\n{traceback.format_exc()}")
        return None


def post_to_api(payload: dict) -> bool:
    try:
        # Test connection first
        test_req = urllib.request.Request(
            API_ENDPOINT.replace("/api/fusion/log", "/api/fusion/log"),
            headers={"User-Agent": "ShopFusion/1.0"},
            method="GET",
        )
        with urllib.request.urlopen(test_req, timeout=5) as test_resp:
            _ui.messageBox(f"Connection OK: {test_resp.status}")

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
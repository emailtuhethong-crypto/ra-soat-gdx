import { getSheetData, updateRange } from "../_shared/sheets.js";
import { validateFields, normalizeFields } from "../_shared/validate.js";
import { buildCodeToRowMap, json } from "../_shared/utils.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body không phải JSON hợp lệ" }, 400);
  }

  const { unit, code, fields } = body || {};
  if (!unit || !code || !fields) {
    return json({ error: "Thiếu 'unit', 'code' hoặc 'fields'" }, 400);
  }

  const { valid, errors } = validateFields(fields);
  if (!valid) return json({ error: "Dữ liệu không hợp lệ", details: errors }, 422);

  try {
    const raw = await getSheetData(env, unit);
    const dataRows = raw.slice(1);
    const codeToRow = buildCodeToRowMap(dataRows);
    const rowNumber = codeToRow.get(String(code).trim());

    if (!rowNumber) {
      return json({ error: `Không tìm thấy mã '${code}' trong đơn vị '${unit}'` }, 404);
    }

    const normalized = normalizeFields(fields);
    const values = [[normalized.G, normalized.H, normalized.I, normalized.J, normalized.K]];

    await updateRange(env, unit, `G${rowNumber}:K${rowNumber}`, values);

    return json({ success: true, unit, code, rowNumber });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

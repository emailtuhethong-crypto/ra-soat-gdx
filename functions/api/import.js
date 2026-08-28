import { getSheetData, batchUpdateRanges } from "../_shared/sheets.js";
import { validateFields, normalizeFields } from "../_shared/validate.js";
import { buildCodeToRowMap, json } from "../_shared/utils.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body không phải JSON hợp lệ" }, 400);
  }

  const { unit, rows } = body || {};
  if (!unit || !Array.isArray(rows) || rows.length === 0) {
    return json({ error: "Thiếu 'unit' hoặc 'rows' rỗng" }, 400);
  }

  try {
    const raw = await getSheetData(env, unit);
    const dataRows = raw.slice(1);
    const codeToRow = buildCodeToRowMap(dataRows);

    const updated = [];
    const notFound = [];
    const invalid = [];
    const valueRanges = [];

    for (const item of rows) {
      const code = item.code !== undefined ? String(item.code).trim() : "";
      if (!code) {
        invalid.push({ code: item.code, errors: { code: "Thiếu mã (cột D)" } });
        continue;
      }

      const { valid, errors } = validateFields(item);
      if (!valid) {
        invalid.push({ code, errors });
        continue;
      }

      const rowNumber = codeToRow.get(code);
      if (!rowNumber) {
        notFound.push(code);
        continue;
      }

      const normalized = normalizeFields(item);
      valueRanges.push({
        range: `'${unit}'!G${rowNumber}:K${rowNumber}`,
        values: [[normalized.G, normalized.H, normalized.I, normalized.J, normalized.K]],
      });
      updated.push(code);
    }

    if (valueRanges.length > 0) {
      await batchUpdateRanges(env, valueRanges);
    }

    return json({
      success: true,
      unit,
      totalRows: rows.length,
      updatedCount: updated.length,
      updated,
      notFoundCount: notFound.length,
      notFound,
      invalidCount: invalid.length,
      invalid,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

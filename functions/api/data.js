
import { getSheetData } from "../_shared/sheets.js";
import { ALL_COLUMNS, EDITABLE_COLUMNS, LOCKED_COLUMNS, MATCH_COLUMN } from "../_shared/config.js";
import { json } from "../_shared/utils.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const unit = url.searchParams.get("unit");
  if (!unit) return json({ error: "Thiếu tham số 'unit'" }, 400);

  try {
    const raw = await getSheetData(env, unit);
    const [headerRow, ...dataRows] = raw;

    const rows = dataRows
      .filter((r) => r.length > 0)
      .map((r) => {
        const obj = {};
        ALL_COLUMNS.forEach((col, i) => {
          obj[col] = r[i] !== undefined ? r[i] : "";
        });
        return obj;
      });

    return json({
      unit,
      header: headerRow || [],
      columns: ALL_COLUMNS,
      lockedColumns: LOCKED_COLUMNS,
      editableColumns: EDITABLE_COLUMNS,
      matchColumn: MATCH_COLUMN,
      rows,
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

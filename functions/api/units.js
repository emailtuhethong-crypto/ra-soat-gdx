import { listSheetTitles } from "../_shared/sheets.js";
import { json } from "../_shared/utils.js";

export async function onRequestGet({ env }) {
  try {
    const units = await listSheetTitles(env);
    return json({ units });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

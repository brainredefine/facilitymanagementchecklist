// pages/api/upload-to-odoo.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 1) Récup input du front
  const { assetId, pdfBase64, date } = req.body || {};
  if (!assetId || !pdfBase64) {
    return res.status(400).json({ error: "assetId et pdfBase64 requis" });
  }

  // 2) Mapping asset_id -> res_id (mets tes vraies correspondances ici)
  // (Tu peux aussi charger ce mapping depuis une DB, ou un JSON côté serveur)
  const assetMap = {
    "A1": 123, // exemple
    "B2": 456,
  };

  const resId = assetMap[assetId];
  if (!resId) {
    return res.status(400).json({ error: `Pas de mapping pour Asset ${assetId}` });
  }

  // 3) Build payload Odoo
  const payload = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute_kw",
      args: [
        process.env.ODOO_DB,                             // DB
        parseInt(process.env.ODOO_UID, 10),              // UID
        process.env.ODOO_API_KEY,                        // API key / password
        "ir.attachment", "create",
        [{
          name: `Pruefbericht_${assetId}_${date || ""}.pdf`,
          datas: pdfBase64,
          mimetype: "application/pdf",
          res_model: "property.property",                // adapte si besoin
          res_id: resId,
        }]
      ]
    },
    id: Date.now()
  };

  try {
    const r = await fetch(`${process.env.ODOO_URL}/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (data?.error) {
      return res.status(500).json({ error: data.error });
    }
    return res.status(200).json({ attachmentId: data.result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

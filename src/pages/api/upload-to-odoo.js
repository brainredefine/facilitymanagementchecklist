// pages/api/upload-to-odoo.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 1) Récup input du front
  const { assetId, pdfBase64, date,
    building_envelope,
    exterior_facilities,
    interior_areas,
    technical_equipment,
    sustainability_esg,
    significant_structural_defects,
    location_market_situation
  } = req.body || {};

  if (!assetId || !pdfBase64) {
    return res.status(400).json({ error: "assetId et pdfBase64 requis" });
  }

  // 2) Mapping asset_id -> res_id (mets tes vraies correspondances ici)
  const assetMap = {
    "AC1": 1,
    "AC2": 104,
    "AC3": 147,
    "AC4": 322,
    "AD1": 2143,
    "AD2": 2218,
    "AD3": 2227
  };

  const resId = assetMap[assetId];
  if (!resId) {
    return res.status(400).json({ error: `Pas de mapping pour Asset ${assetId}` });
  }

  // petit helper pour convertir NaN/undefined en null
  const norm = (v) => (v === null || v === undefined || Number.isNaN(v) ? null : v);

  // 3) Build payload Odoo pour créer l'attachement PDF
  const payloadAttach = {
    jsonrpc: "2.0",
    method: "call",
    params: {
      service: "object",
      method: "execute_kw",
      args: [
        process.env.ODOO_DB,
        parseInt(process.env.ODOO_UID, 10),
        process.env.ODOO_API_KEY,
        "ir.attachment", "create",
        [{
          name: `Pruefbericht_${assetId}_${date || ""}.pdf`,
          datas: pdfBase64,
          mimetype: "application/pdf",
          res_model: "property.property",
          res_id: resId,
        }]
      ]
    },
    id: Date.now()
  };

  try {
    // (A) créer l'attachement
    const r = await fetch(`${process.env.ODOO_URL}/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadAttach),
    });
    const data = await r.json();
    if (data?.error) {
      return res.status(500).json({ error: data.error });
    }
    const attachmentId = data.result;

    // (B) écrire les 7 champs sur property.property
    const fieldsToWrite = {
      building_envelope:              norm(building_envelope),
      exterior_facilities:            norm(exterior_facilities),
      interior_areas:                 norm(interior_areas),
      technical_equipment:            norm(technical_equipment),
      sustainability_esg:             norm(sustainability_esg),
      significant_structural_defects: norm(significant_structural_defects),
      location_market_situation:      norm(location_market_situation),
    };

    const payloadWrite = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          process.env.ODOO_DB,
          parseInt(process.env.ODOO_UID, 10),
          process.env.ODOO_API_KEY,
          "property.property", "write",
          [[resId], fieldsToWrite]
        ]
      },
      id: Date.now() + 1
    };

    const rw = await fetch(`${process.env.ODOO_URL}/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadWrite),
    });
    const dataWrite = await rw.json();

    if (dataWrite?.error) {
      // on renvoie l'attachement OK + warning pour le write
      return res.status(207).json({ 
        attachmentId, 
        warning: "PDF attaché mais échec write champs.",
        odooError: dataWrite.error 
      });
    }

    return res.status(200).json({ attachmentId, writeOk: dataWrite.result === true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

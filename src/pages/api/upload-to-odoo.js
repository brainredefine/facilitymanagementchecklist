// pages/api/upload-to-odoo.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 1) Récup input du front
  const {
    assetId,
    pdfBase64,
    date,
    building_envelope,
    exterior_facilities,
    interior_areas,
    technical_equipment,
    sustainability_esg,
    significant_structural_defects,
    location_market_situation,
  } = req.body || {};

  if (!assetId || !pdfBase64) {
    return res.status(400).json({ error: "assetId et pdfBase64 requis" });
  }

  // 2) Mapping asset_id -> res_id (mets tes vraies correspondances ici)
  const assetMap = {
    AC1: 1,
    AC2: 104,
    AC3: 147,
    AC4: 322,
    AD1: 2143,
    AD2: 2218,
    AD3: 2227,
  };

  const resId = assetMap[assetId];
  if (!resId) {
    return res.status(400).json({ error: `Pas de mapping pour Asset ${assetId}` });
  }

  // ---- Helpers ----

  // Convertit vers float arrondi à 1 décimale, gère "7,5", vide => null
  const asFloat1 = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const s = String(v).trim().replace(/\s/g, "").replace(",", ".");
    const n = Number(s);
    if (Number.isNaN(n)) return null;
    return Math.round(n * 10) / 10;
  };

  // Appel JSON-RPC générique
  async function odooRpc(model, method, ...odooArgs) {
    const payload = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          process.env.ODOO_DB,
          parseInt(process.env.ODOO_UID, 10),
          process.env.ODOO_API_KEY,
          model,
          method,
          ...odooArgs,
        ],
      },
      id: Date.now(),
    };

    const r = await fetch(`${process.env.ODOO_URL}/jsonrpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (data?.error) {
      // remonte l’erreur Odoo lisible
      const msg =
        typeof data.error === "string"
          ? data.error
          : JSON.stringify(data.error, null, 2);
      throw new Error(msg);
    }
    return data.result;
  }

  // Champs à écrire (float 1 décimale ou null)
  const fieldsToWrite = {
    building_envelope: asFloat1(building_envelope),
    exterior_facilities: asFloat1(exterior_facilities),
    interior_areas: asFloat1(interior_areas),
    technical_equipment: asFloat1(technical_equipment),
    sustainability_esg: asFloat1(sustainability_esg),
    significant_structural_defects: asFloat1(significant_structural_defects),
    location_market_situation: asFloat1(location_market_situation),
  };

  // Nettoie les undefined (Odoo n’aime pas trop)
  for (const k of Object.keys(fieldsToWrite)) {
    if (fieldsToWrite[k] === undefined) fieldsToWrite[k] = null;
  }

  // 3) Build payload attachement PDF (créé sur property.property)
  const attachArgs = [
    "ir.attachment",
    "create",
    [
      {
        name: `Pruefbericht_${assetId}_${date || ""}.pdf`,
        datas: pdfBase64,
        mimetype: "application/pdf",
        res_model: "property.property",
        res_id: resId,
      },
    ],
  ];

  try {
    // (A) créer l’attachement
    const attachmentId = await odooRpc(...attachArgs);

    // (B) écrire les 7 champs sur property.property
    const writeOk = await odooRpc(
      "property.property",
      "write",
      [[resId], fieldsToWrite]
    );

    // (C) read-back pour vérifier ce qui est vraiment stocké
    const readBack = await odooRpc(
      "property.property",
      "read",
      [[resId], Object.keys(fieldsToWrite)]
    );

    // Compare brut (attention: Odoo peut arrondir/formatter)
    const beforeAfter = {};
    for (const k of Object.keys(fieldsToWrite)) {
      beforeAfter[k] = {
        sent: fieldsToWrite[k],
        stored: readBack?.[0]?.[k] ?? null,
      };
    }

    // Détecter si au moins une valeur correspond (changement visible)
    const propertyWriteChanged = Object.keys(beforeAfter).some((k) => {
      // Comparaison tolérante aux floats (arrondi 1 décimale)
      const sent = beforeAfter[k].sent;
      const stored = beforeAfter[k].stored;
      if (sent === null && stored === null) return true;
      if (sent === null || stored === null) return false;
      return Math.round(Number(stored) * 10) === Math.round(Number(sent) * 10);
    });

    // Réponse OK (on renvoie aussi le readBack pour tracer côté front si besoin)
    return res.status(200).json({
      attachmentId,
      writeOk: writeOk === true,
      propertyWriteChanged,
      values: beforeAfter,
    });
  } catch (err) {
    // Cas “PDF attaché mais write KO” → on n’a pas d’attachmentId fiable si l’erreur vient après (donc 500 simple)
    return res.status(500).json({
      error: err.message || "Erreur inconnue côté Odoo",
    });
  }
}

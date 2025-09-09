"use client";
import { pdf } from "@react-pdf/renderer";
import ReportPDF from "../components/ReportPDF"; // ajuste le chemin si besoin
import { useState, useEffect, useRef } from "react";
import Button from "../components/ui/button";

export default function FacilityChecklistForm() {
  const [assetId, setAssetId] = useState("");
  const [assetManagerName, setAssetManagerName] = useState("");
  const [points, setPoints] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [currentFiles, setCurrentFiles] = useState([]);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILES = 5;

  useEffect(() => {
    fetch('/mapping_checklist_40_points.json')
      .then(res => res.json())
      .then(data => setPoints(data));
  }, []);

  const next = () => setCurrentIndex(i => Math.min(i + 1, points.length + 1));
  const previous = () => setCurrentIndex(i => Math.max(i - 1, 0));
  const goToEnd = () => setCurrentIndex(points.length + 1);

  const handleRating = value => {
    const key = currentIndex === 0 ? 'asset_id' : points[currentIndex - 1].point_id;
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = e => {
    const files = Array.from(e.target.files);
    if (currentFiles.length + files.length > MAX_FILES) {
      alert(`Vous ne pouvez télécharger que ${MAX_FILES} photos maximum. Actuellement: ${currentFiles.length}, tentative d'ajout: ${files.length}`);
      return;
    }
    setCurrentFiles(prev => [...prev, ...files]);
  };

  const removeFile = indexToRemove => {
    setCurrentFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
          width *= ratio;
          height *= ratio;
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getAdvice = async () => {
    if (currentFiles.length === 0) return alert("Bitte laden Sie mindestens ein Foto hoch.");
    try {
      const point = points[currentIndex - 1];
      const compressedImages = await Promise.all(currentFiles.map(file => compressImage(file)));
      const payload = currentFiles.length === 1
        ? { label: point.libelle, image: compressedImages[0] }
        : { label: point.libelle, images: compressedImages };
      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }
      const { suggestion } = await res.json();
      setComment(suggestion);
    } catch (err) {
      console.error('Erreur AI:', err);
      alert('Impossible de traiter l\'image(s). Veuillez essayer avec des images plus petites.');
    }
  };

  const validatePoint = async () => {
  if (currentIndex === 0) return;
  const point = points[currentIndex - 1];
  const selected = formData[point.point_id] || '';
  if (!selected) return alert('Bitte wählen Sie eine Note aus');

  // compresser les photos sélectionnées pour CE point
  let compressedImages = [];
  if (currentFiles.length > 0) {
    try {
      compressedImages = await Promise.all(currentFiles.map(f => compressImage(f)));
    } catch (e) {
      console.warn('Compression images failed:', e);
    }
  }

  // sauver commentaire + images pour CE point
  setFormData(prev => ({
    ...prev,
    [`${point.point_id}_comment`]: comment,
    [`${point.point_id}_images`]: compressedImages, // <-- tableau de base64 (sans prefix)
  }));

  // reset UI
  setComment('');
  setCurrentFiles([]);
  if (fileInputRef.current) fileInputRef.current.value = '';
  next();
};
console.log('payload keys', Object.keys(payload));
console.log('sample point 1/comm/imgs', payload['1'], payload['1_comment'], Array.isArray(payload['1_images']) ? payload['1_images'].length : 'no imgs');

    const autoGeneratePdf = async (payload) => {
    try {
      const blob = await pdf(<ReportPDF data={payload} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${payload.asset_id || "Pruefbericht"}_${payload.date}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Erreur auto PDF:", e);
    }
  };


    const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

    // --- GROUPED AVERAGES -------------------------------------------------
const groups = {
  building_envelope:           ["1","2","3","4"],
  exterior_facilities:         ["5","6","7","8","9"],
  interior_areas:              ["10","11","12","13","14"],
  technical_equipment:         ["15","16","17","18","19","20","21"],
  sustainability_esg:          ["22","23","24","25","26","27","28"],
  significant_structural_defects: ["29","30","31","32","33","34","35"],
  location_market_situation:   ["36","37","38","39","40"],
};

const toNum = (v) => {
  if (v === 'N/A' || v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// ⬇️ renvoie un NUMBER arrondi à 1 décimale (ou null)
const avg = (keys, data) => {
  const nums = keys.map(k => toNum(data[k])).filter(n => n !== null);
  if (nums.length === 0) return null; // tout en N/A -> null
  const s = nums.reduce((a,b) => a + b, 0);
  return Math.round((s / nums.length) * 10) / 10; // ex: 3.4
};

const computeGroupedAverages = (data) => ({
  building_envelope:              avg(groups.building_envelope, data),
  exterior_facilities:            avg(groups.exterior_facilities, data),
  interior_areas:                 avg(groups.interior_areas, data),
  technical_equipment:            avg(groups.technical_equipment, data),
  sustainability_esg:             avg(groups.sustainability_esg, data),
  significant_structural_defects: avg(groups.significant_structural_defects, data),
  location_market_situation:      avg(groups.location_market_situation, data),
});


const submitAll = async () => {
  const missingPoints = points.filter(point => !formData[point.point_id]);
  if (missingPoints.length > 0) {
    const missingIds = missingPoints.map(p => p.point_id).join(', ');
    alert(`Bitte geben Sie eine Note für die folgenden Punkte ein: ${missingIds}`);
    const firstMissingIndex = points.findIndex(p => p.point_id === missingPoints[0].point_id);
    setCurrentIndex(firstMissingIndex + 1);
    return;
  }

  const grouped = computeGroupedAverages(formData);

  const payload = { 
    ...formData,
    date: new Date().toISOString().split('T')[0]
  };

  try {
    // — Générer le PDF tel quel (sans résumé) —
    const blob = await pdf(<ReportPDF data={payload} />).toBlob();

    // — Puis envoyer les moyennes à l’API Odoo —
    const base64Pdf = await blobToBase64(blob);

    const resp = await fetch("/api/upload-to-odoo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: payload.asset_id,
        pdfBase64: base64Pdf,
        date: payload.date,
        // 7 moyennes uniquement :
        building_envelope: grouped.building_envelope,
        exterior_facilities: grouped.exterior_facilities,
        interior_areas: grouped.interior_areas,
        technical_equipment: grouped.technical_equipment,
        sustainability_esg: grouped.sustainability_esg,
        significant_structural_defects: grouped.significant_structural_defects,
        location_market_situation: grouped.location_market_situation,
      }),
    });

    if (!resp.ok) {
      const errTxt = await resp.text();
      console.error("Odoo upload failed:", errTxt);
      alert("Impossible d'envoyer le PDF dans Odoo.");
      return;
    }

    const out = await resp.json();
    console.log("PDF attaché dans Odoo, attachmentId:", out.attachmentId);

    setSubmitted(true);
  } catch (err) {
    console.error("Erreur submitAll:", err);
    alert("Erreur lors de la génération ou de l'envoi du PDF.");
  }
};

  // Page de succès
  if (submitted) {
    return <div id="result" className="success">✔️ Daten gesendet!</div>;
  }

  // Page d'Asset ID
  if (currentIndex === 0) {
    return (
      <>
        <h1>Checklist Facility Management</h1>
        <div className="point-container" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
          <p><strong>Asset-ID (z.B. A1, B2…)</strong></p>
          <input
            type="text"
            value={assetId}
            onChange={e => setAssetId(e.target.value)}
            style={{ maxWidth: '100%', boxSizing: 'border-box', marginBottom: '1rem' }}
          />
          <p><strong>Asset Manager Name</strong></p>
          <input
            type="text"
            value={assetManagerName}
            onChange={e => setAssetManagerName(e.target.value)}
            style={{ maxWidth: '100%', boxSizing: 'border-box' }}
          />
          <button
            className="action-button"
            onClick={() => {
              if (!assetId || !assetManagerName) return alert('Bitte geben Sie eine Asset-ID und einen Asset Manager Name ein');
              setFormData({ asset_id: assetId, asset_manager_name: assetManagerName });
              next();
            }}
          >
            Weiter ➔
          </button>
        </div>
      </>
    );
  }

  // Affichage des points 1 à 25
  if (currentIndex > 0 && currentIndex <= points.length) {
    const idx = currentIndex - 1;
    const point = points[idx];
    const selected = formData[point.point_id] || '';

    return (
      <>
        <h1>Point {currentIndex}/{points.length}: {point.libelle}</h1>
        <div className="point-container" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
          <div className="buttons">
            {[1, 2, 3, 4, 5, 'N/A'].map(v => (
              <button
                key={v}
                className={selected === v ? 'selected' : ''}
                onClick={() => handleRating(v)}
              >
                {v}
              </button>
            ))}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label className="action-button" htmlFor="file-input">
              Photos hinzufügen ({currentFiles.length}/{MAX_FILES})
              <input
                id="file-input"
                type="file"
                accept="image/*"
                multiple
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </label>
            {currentFiles.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Ausgewählte Fotos:</strong></p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '0.5rem' }}>
                  {currentFiles.map((file, index) => (
                    <div key={index} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                      />
                      <button
                        onClick={() => removeFile(index)}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: 'rgba(255, 0, 0, 0.8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '25px',
                          height: '25px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Foto entfernen"
                      >
                        ×
                      </button>
                      <p style={{
                        padding: '5px',
                        margin: '0',
                        fontSize: '12px',
                        background: '#f5f5f5',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="action-button" onClick={getAdvice} style={{ marginTop: '1rem' }}>
            KI-Analyse {currentFiles.length > 0 && `(${currentFiles.length} Foto${currentFiles.length > 1 ? 's' : ''})`}
          </button>

          <textarea
            id="comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Kommentar hinzufügen oder KI-Vorschlag bearbeiten..."
            style={{
              width: '100%',
              maxWidth: '100%',
              minHeight: '100px',
              marginTop: '0.5rem',
              padding: '0.8rem',
              border: '1px solid #1a2a44',
              borderRadius: '8px',
              background: '#ffffff',
              color: '#2c3e50',
              fontSize: '1rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.3s ease',
              boxSizing: 'border-box',
              resize: 'vertical',
              borderLeft: comment && comment.includes('Note:') ? '4px solid #3b5998' : '1px solid #1a2a44'
            }}
          />

          <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
            {currentIndex > 1 && (
              <button className="action-button" onClick={previous}>
                ← Zurück
              </button>
            )}
            <button
              className="action-button"
              onClick={validatePoint}
              style={{
                backgroundColor: selected ? '#4CAF50' : '#1a2a44',
                color: 'white',
                opacity: selected ? 1 : 0.6
              }}
            >
              Bestätigen
            </button>
            <button className="action-button" onClick={next}>
              Weiter ➔
            </button>
            <button className="action-button" onClick={goToEnd}>
              Zum Ende ➔
            </button>
          </div>
        </div>
      </>
    );
  }

  // Page finale (Checklist abgeschlossen)
  if (currentIndex === points.length + 1) {
    const missingPoints = points.filter(point => !formData[point.point_id]);

    return (
      <>
        <h1>Checklist abgeschlossen</h1>
        <div className="point-container" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
          {missingPoints.length > 0 ? (
            <p style={{ color: '#d32f2f' }}>
              <strong>Achtung: Die folgenden Punkte fehlen noch: {missingPoints.map(p => p.point_id).join(', ')}</strong>
            </p>
          ) : (
            <p><strong>Alle Punkte wurden überprüft. Bitte senden Sie die Daten.</strong></p>
          )}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
            <button
              className="action-button"
              onClick={() => {
                if (missingPoints.length > 0) {
                  const firstMissingIndex = points.findIndex(p => p.point_id === missingPoints[0].point_id);
                  setCurrentIndex(firstMissingIndex + 1);
                } else {
                  setCurrentIndex(points.length);
                }
              }}
            >
              ← Zurück
            </button>
            <button className="action-button" onClick={submitAll}>
              ✅ Daten senden
            </button>
          </div>
        </div>
      </>
    );
  }

  return null;
}
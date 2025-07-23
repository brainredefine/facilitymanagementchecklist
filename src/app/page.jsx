"use client";

import { useState, useEffect, useRef } from "react";
import Button from "../components/ui/button";

export default function FacilityChecklistForm() {
  const [assetId, setAssetId] = useState("");
  const [points, setPoints] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  // Charger les points
  useEffect(() => {
    fetch('/mapping_checklist_25_points.json')
      .then((res) => res.json())
      .then((data) => setPoints(data));
  }, []);

  const next = () => setCurrentIndex((i) => i + 1);

  const handleRating = (value) => {
    const key = currentIndex === 0 ? 'asset_id' : points[currentIndex - 1].point_id;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setCurrentFile(file);
  };

  const getAdvice = async () => {
    if (!currentFile) return alert("Bitte laden Sie ein Foto hoch.");
    const point = points[currentIndex - 1];
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: point.libelle, image: base64 }),
      });
      const { suggestion } = await res.json();
      setAiSuggestion(suggestion);
    };
    reader.readAsDataURL(currentFile);
  };

  const submitAll = async () => {
    const payload = { ...formData, date: new Date().toISOString().split('T')[0] };
    await fetch('https://maxencegauthier.app.n8n.cloud/webhook/facilitymanagementchecklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSubmitted(true);
  };

  // Affichage
  if (submitted) {
    return (
      <div id="result" className="success">
        ✔️ Daten gesendet!
      </div>
    );
  }

  // Avant saisie de l'assetId
  if (currentIndex === 0) {
    return (
      <>
        <h1>Checklist Facility Management</h1>
        <div className="point-container">
          <p><strong>Asset-ID (z.B. A1, B2…)</strong></p>
          <input
            type="text"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
          />
          <button className="action-button" onClick={() => {
              if (!assetId) return alert('Bitte geben Sie eine Asset-ID ein');
              setFormData({ asset_id: assetId });
              next();
            }}>
            Weiter ➔
          </button>
        </div>
      </>
    );
  }

  // Points séquentiels
  const idx = currentIndex - 1;
  if (idx < points.length) {
    const point = points[idx];
    const selected = formData[point.point_id] || '';
    return (
      <>
        <h1>Point {currentIndex}/{points.length}: {point.libelle}</h1>
        <div className="point-container">
          <div className="buttons">
            {[1,2,3,4,5,'N/A'].map((v) => (
              <button
                key={v}
                className={selected === v ? 'selected' : ''}
                onClick={() => handleRating(v)}
              >
                {v}
              </button>
            ))}
          </div>
          {/* Custom file input for German localization */}
          <label className="action-button" htmlFor="file-input">
            Datei wählen
            <input
              id="file-input"
              type="file"
              accept="image/*"
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </label>
          <span className="file-name">
            {currentFile ? currentFile.name : 'Keine Datei gewählt'}
          </span>
          {currentFile && (
            <img
              id="photo-preview"
              src={URL.createObjectURL(currentFile)}
              alt="Preview"
              style={{ display: 'block' }}
            />
          )}
          <button className="action-button" onClick={getAdvice}>KI-Analyse</button>
          {aiSuggestion && <p id="ai-suggestion">{aiSuggestion}</p>}
          <button className="action-button" onClick={() => {
              if (!selected) return alert('Bitte wählen Sie eine Note aus');
              setAiSuggestion('');
              setCurrentFile(null);
              setTimeout(() => {
                if (fileInputRef.current) fileInputRef.current.value = '';
              }, 0);
              next();
            }}>
            Weiter ➔
          </button>
        </div>
      </>
    );
  }

  // Soumission finale
  return (
    <button className="action-button" onClick={submitAll}>
      ✅ Daten senden
    </button>
  );
}

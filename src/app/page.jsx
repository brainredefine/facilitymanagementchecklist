"use client";

import { useState, useEffect } from "react";
import Button from "../components/ui/button";

export default function FacilityChecklistForm() {
  const [assetId, setAssetId] = useState("");
  const [points, setPoints] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
    if (!currentFile) return alert("Veuillez uploader une photo.");
    const point = points[currentIndex - 1];
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: point.libelle, image: base64 }),
      });
      const data = await res.json();
      setAiSuggestion(data);
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
      <div className="p-4 text-green-600 font-bold">
        ✔️ Données envoyées avec succès !
      </div>
    );
  }

  // Avant saisie de l'assetId
  if (currentIndex === 0) {
    return (
      <div className="p-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">Checklist Facility Management</h1>
        <div className="point-container mb-4">
          <p className="mb-2">Asset ID (ex: A1, B2…)</p>
          <input
            type="text"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <Button
            onClick={() => {
              if (!assetId) return alert('Merci d’entrer un Asset ID');
              setFormData({ ...formData, asset_id: assetId });
              next();
            }}
          >Suivant ➔</Button>
        </div>
      </div>
    );
  }

  // Points séquentiels
  const idx = currentIndex - 1;
  if (idx < points.length) {
    const point = points[idx];
    const selected = formData[point.point_id] || null;
    return (
      <div className="p-4 max-w-xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">Point {currentIndex}/{points.length}</h1>
        <div className="point-container p-4 mb-6">
          <p className="mb-4 font-medium">{point.libelle}</p>
          <div className="buttons flex flex-wrap gap-2 mb-4">
            {[1,2,3,4,5,'N/A'].map((v) => (
              <Button
                key={v}
                variant={selected === v ? 'default' : 'outline'}
                onClick={() => handleRating(v)}
                className={selected === v ? 'selected' : ''}
              >{v}</Button>
            ))}
          </div>
          <div className="mb-4">
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {currentFile && (
              <img
                src={URL.createObjectURL(currentFile)}
                alt="Prévisualisation"
                className="mt-2 max-w-full rounded shadow"
              />
            )}
          </div>
          <Button onClick={getAdvice} className="mb-4">Conseil IA</Button>
          {aiSuggestion && <p id="ai-suggestion" className="italic mb-4">{aiSuggestion}</p>}
          <Button
            onClick={() => {
              if (!selected) return alert('Veuillez sélectionner une note');
              setAiSuggestion('');
              setCurrentFile(null);
              next();
            }}
          >Suivant ➔</Button>
        </div>
      </div>
    );
  }

  // Soumission finale
  return (
    <div className="p-4 max-w-xl mx-auto text-center">
      <Button onClick={submitAll}>✅ Envoyer tout</Button>
    </div>
  );
}

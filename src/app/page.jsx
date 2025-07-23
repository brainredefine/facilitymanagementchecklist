"use client";

import { useState, useEffect, useRef } from "react";
import Button from "../components/ui/button";

export default function FacilityChecklistForm() {
  const [assetId, setAssetId] = useState("");
  const [points, setPoints] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  // Charger les points
  useEffect(() => {
    fetch('/mapping_checklist_25_points.json')
      .then(res => res.json())
      .then(data => setPoints(data));
  }, []);

  const next = () => setCurrentIndex(i => i + 1);

  const handleRating = value => {
    const key = currentIndex === 0 ? 'asset_id' : points[currentIndex - 1].point_id;
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    setCurrentFile(file);
  };

  // Compression de l'image
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
    if (!currentFile) return alert("Bitte laden Sie ein Foto hoch.");
    try {
      const point = points[currentIndex - 1];
      const base64 = await compressImage(currentFile);
      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: point.libelle, image: base64 }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }
      const { suggestion } = await res.json();
      setComment(suggestion); // Override current comment with AI suggestion
    } catch (err) {
      console.error('Erreur AI:', err);
      alert('Impossible de traiter l\'image. Veuillez essayer une plus petite.');
    }
  };

  const submitAll = async () => {
    const payload = { ...formData, date: new Date().toISOString().split('T')[0] };
    console.log('Payload envoyé au webhook:', payload); // Pour vérifier les données
    await fetch('https://redefineam.app.n8n.cloud/webhook/facilitymanagementchecklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSubmitted(true);
  };

  // Affichage
  if (submitted) {
    return <div id="result" className="success">✔️ Daten gesendet!</div>;
  }

  // Saisie de l'assetId
  if (currentIndex === 0) {
    return (
      <>
        <h1>Checklist Facility Management</h1>
        <div className="point-container" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
          <p><strong>Asset-ID (z.B. A1, B2…)</strong></p>
          <input type="text" value={assetId} onChange={e => setAssetId(e.target.value)} style={{ maxWidth: '100%', boxSizing: 'border-box' }} />
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
        <div className="point-container" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
          <div className="buttons">
            {[1,2,3,4,5,'N/A'].map(v => (
              <button key={v} className={selected === v ? 'selected' : ''} onClick={() => handleRating(v)}>{v}</button>
            ))}
          </div>
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
          {currentFile && <img id="photo-preview" src={URL.createObjectURL(currentFile)} alt="Preview" style={{ display: 'block', maxWidth: '100%' }} />}
          <button className="action-button" onClick={getAdvice}>KI-Analyse</button>
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
          <div style={{ marginTop: '1rem' }}>
            <button className="action-button" onClick={() => {
              if (!selected) return alert('Bitte wählen Sie eine Note aus');
              setFormData(prev => ({
                ...prev,
                [`${point.point_id}_comment`]: comment
              }));
              setComment('');
              setCurrentFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
              next();
            }}>
              Weiter ➔
            </button>
          </div>
        </div>
      </>
    );
  }

  // Soumission finale
  return <button className="action-button" onClick={submitAll}>✅ Daten senden</button>;
}
'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '../components/ui/button';

export default function FacilityChecklistForm() {
  const [assetId, setAssetId] = useState('');
  const [points, setPoints] = useState([]);                    // tableau des points complets
  const [comments, setComments] = useState([]);                // tableau parallèle de commentaires éditables
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  // 1) Charger les points + initialiser les commentaires
  useEffect(() => {
    fetch('/mapping_checklist_25_points.json')
      .then(res => res.json())
      .then(data => {
        setPoints(data);
        // on part de la propriété `commentaire` dans ton JSON
        setComments(data.map(pt => pt.commentaire || ''));
      })
      .catch(err => console.error(err));
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

  // compression d’image (idem)
  const compressImage = (file, maxW = 800, maxH = 800, quality = 0.7) => {
    /* ... même code que toi ... */
  };

  const getAdvice = async () => {
    if (!currentFile) return alert("Bitte laden Sie ein Foto hoch.");
    /* ... même code que toi ... */
  };

  // 2) Gestion de la mise à jour du commentaire
  const handleCommentInput = (e, idx) => {
    const newComments = [...comments];
    newComments[idx] = e.currentTarget.textContent;
    setComments(newComments);
  };

  // 3) Soumettre tout, y compris les commentaires
  const submitAll = async () => {
    const payload = {
      ...formData,
      date: new Date().toISOString().split('T')[0],
      comments: points.reduce((acc, pt, i) => {
        acc[pt.point_id] = comments[i];
        return acc;
      }, {})
    };
    await fetch('https://redefineam.app.n8n.cloud/webhook/facilitymanagementchecklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setSubmitted(true);
  };

  // --- RENDUS ---

  if (submitted) {
    return <div id="result" className="success">✔️ Daten gesendet!</div>;
  }

  // 0️⃣ Saisie Asset-ID
  if (currentIndex === 0) {
    return (
      <>
        <h1>Checklist Facility Management</h1>
        <div className="point-container">
          <p><strong>Asset-ID (z.B. A1, B2…)</strong></p>
          <input
            type="text"
            value={assetId}
            onChange={e => setAssetId(e.target.value)}
          />
          <button
            className="action-button"
            onClick={() => {
              if (!assetId) return alert('Bitte geben Sie eine Asset-ID ein');
              setFormData({ asset_id: assetId });
              next();
            }}
          >
            Weiter ➔
          </button>
        </div>
      </>
    );
  }

  // 1️⃣ … 25️⃣ Points
  const idx = currentIndex - 1;
  if (idx < points.length) {
    const point = points[idx];
    const selected = formData[point.point_id] || '';

    return (
      <>
        <h1>Point {currentIndex}/{points.length}: {point.libelle}</h1>
        <div className="point-container">
          <div className="buttons">
            {[1,2,3,4,5,'N/A'].map(v => (
              <button
                key={v}
                className={selected === v ? 'selected' : ''}
                onClick={() => handleRating(v)}
              >
                {v}
              </button>
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
          {currentFile && (
            <img
              id="photo-preview"
              src={URL.createObjectURL(currentFile)}
              alt="Preview"
              style={{ display: 'block', maxWidth: '200px', margin: '1rem 0' }}
            />
          )}

          <button className="action-button" onClick={getAdvice}>
            KI-Analyse
          </button>
          {aiSuggestion && <p id="ai-suggestion">{aiSuggestion}</p>}

          {/* ✏️ Zone éditable pour le commentaire */}
          <div
            className="prose prose-sm border rounded p-2 mt-4 focus:outline-none"
            contentEditable
            suppressContentEditableWarning
            onInput={e => handleCommentInput(e, idx)}
          >
            {comments[idx]}
          </div>

          <button
            className="action-button"
            onClick={() => {
              if (!selected) return alert('Bitte wählen Sie eine Note aus');
              setAiSuggestion('');
              setCurrentFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
              next();
            }}
          >
            Weiter ➔
          </button>
        </div>
      </>
    );
  }

  // ✅ Bouton final d’envoi
  return (
    <button className="action-button" onClick={submitAll}>
      ✅ Daten senden
    </button>
  );
}

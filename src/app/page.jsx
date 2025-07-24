"use client";

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
    fetch('/mapping_checklist_25_points.json')
      .then(res => res.json())
      .then(data => setPoints(data));
  }, []);

  const next = () => setCurrentIndex(i => Math.min(i + 1, points.length));
  const previous = () => setCurrentIndex(i => Math.max(i - 1, 0));

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

  const removeFile = (indexToRemove) => {
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
      const compressedImages = await Promise.all(
        currentFiles.map(file => compressImage(file))
      );
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

  const submitAll = async () => {
    const payload = { ...formData, date: new Date().toISOString().split('T')[0] };
    console.log('Payload envoyé au webhook:', payload);
    await fetch('https://redefineam.app.n8n.cloud/webhook/facilitymanagementchecklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSubmitted(true);
  };

  const validatePoint = () => {
    const point = points[currentIndex - 1];
    const selected = formData[point.point_id] || '';
    if (!selected) return alert('Bitte wählen Sie eine Note aus');
    setFormData(prev => ({
      ...prev,
      [`${point.point_id}_comment`]: comment
    }));
    setComment('');
    setCurrentFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    next();
  };

  if (submitted) {
    return <div id="result" className="success">✔️ Daten gesendet!</div>;
  }

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
          <button className="action-button" onClick={() => {
            if (!assetId || !assetManagerName) return alert('Bitte geben Sie eine Asset-ID und einen Asset Manager Name ein');
            setFormData({ asset_id: assetId, asset_manager_name: assetManagerName });
            next();
          }}>
            Weiter ➔
          </button>
        </div>
      </>
    );
  }

  if (currentIndex <= points.length) {
    const idx = currentIndex - 1;
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
                        style={{ 
                          width: '100%', 
                          height: '120px', 
                          objectFit: 'cover',
                          display: 'block'
                        }} 
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
            {currentIndex < points.length && (
              <button className="action-button" onClick={next}>
                Weiter ➔
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Checklist abgeschlossen</h1>
      <div className="point-container" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
        <p><strong>Alle Punkte wurden überprüft. Bitte senden Sie die Daten.</strong></p>
        <button className="action-button" onClick={submitAll}>
          ✅ Daten senden
        </button>
      </div>
    </>
  );
}
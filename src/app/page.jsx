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

  const next = () => setCurrentIndex(i => i + 1);

  const handleRating = value => {
    const key = currentIndex === 0 ? 'asset_id' : points[currentIndex - 1].point_id;
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = e => {
    const files = Array.from(e.target.files).slice(0, MAX_FILES);
    setCurrentFiles(files);
  };

  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.5) => {
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
          canvas.toBlob(blob => {
            const reader2 = new FileReader();
            reader2.onload = () => resolve(reader2.result.split(',')[1]);
            reader2.onerror = reject;
            reader2.readAsDataURL(blob);
          }, 'image/jpeg', quality);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getAdvice = async () => {
    if (currentFiles.length === 0) {
      return alert("Bitte laden Sie Fotos hoch.");
    }
    try {
      const point = points[currentIndex - 1];
      const imagesBase64 = await Promise.all(
        currentFiles.map(file => compressImage(file))
      );
      const payload = { label: point.libelle, images: imagesBase64 };
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
      alert('Impossible de traiter les images. Vérifiez la résolution ou réessayez.');
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
          <Button className="action-button" onClick={() => {
            if (!assetId || !assetManagerName) {
              return alert('Bitte geben Sie eine Asset-ID und einen Asset Manager Name ein');
            }
            setFormData({ asset_id: assetId, asset_manager_name: assetManagerName });
            next();
          }}>
            Weiter ➔
          </Button>
        </div>
      </>
    );
  }

  const idx = currentIndex - 1;
  if (idx < points.length) {
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
          <label className="action-button" htmlFor="file-input">
            Dateien wählen (max {MAX_FILES})
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
          <div className="file-preview-list">
            {currentFiles.length > 0 ? (
              currentFiles.map((file, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${i + 1}`}
                  style={{ maxWidth: '100px', margin: '0.5rem' }}
                />
              ))
            ) : (
              <span>Keine Datei gewählt</span>
            )}
          </div>
          <Button className="action-button" onClick={getAdvice}>
            KI-Analyse
          </Button>
          <textarea
            id="comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Kommentar hinzufügen oder bearbeiten..."
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
              borderLeft: comment.includes('Note:') ? '4px solid #3b5998' : '1px solid #1a2a44'
            }}
          />
          <div style={{ marginTop: '1rem' }}>
            <Button className="action-button" onClick={() => {
              if (!selected) {
                return alert('Bitte wählen Sie eine Note aus');
              }
              setFormData(prev => ({
                ...prev,
                [`${point.point_id}_comment`]: comment,
                [`${point.point_id}_files`]: currentFiles.map(f => f.name)
              }));
              setComment('');
              setCurrentFiles([]);
              if (fileInputRef.current) fileInputRef.current.value = '';
              next();
            }}>
              Weiter ➔
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <Button className="action-button" onClick={submitAll}>
      ✅ Daten senden
    </Button>
  );
}

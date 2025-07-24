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

  const handleRating = (value) => {
    const key = currentIndex === 0 ? 'asset_id' : points[currentIndex - 1].point_id;
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (currentFiles.length + files.length > MAX_FILES) {
      alert(`Vous ne pouvez télécharger que ${MAX_FILES} photos maximum. Actuellement: ${currentFiles.length}, tentative d'ajout: ${files.length}`);
      return;
    }
    setCurrentFiles(prev => [...prev, ...files]);
  };

  const removeFile = (indexToRemove) => {
    setCurrentFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
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
    if (currentFiles.length === 0) {
      alert("Bitte laden Sie mindestens ein Foto hoch.");
      return;
    }
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
      alert("Impossible de traiter l'image(s). Veuillez essayer avec des images plus petites.");
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

  // Shared theme styles (light, discrete) for both sidebar and main
  const commonBg = '#f8f9fa';
  const commonBorder = '1px solid #dee2e6';
  const sidebarStyle = {
    width: '300px',
    background: commonBg,
    borderRight: commonBorder,
    padding: '20px',
    overflowY: 'auto',
    position: 'fixed',
    height: '100vh',
    left: 0,
    top: 0,
  };
  const mainContainerStyle = {
    marginLeft: '300px',
    padding: '20px',
    width: 'calc(100% - 300px)',
    boxSizing: 'border-box',
    background: '#ffffff',
  };

  if (submitted) {
    return <div style={{ ...mainContainerStyle, textAlign: 'center' }}>✔️ Daten gesendet!</div>;
  }

  if (currentIndex === 0) {
    return (
      <div style={mainContainerStyle}>
        <h1>Checklist Facility Management</h1>
        <div style={{ marginTop: '20px' }}>
          <p><strong>Asset-ID (z.B. A1, B2…)</strong></p>
          <input
            type="text"
            value={assetId}
            onChange={e => setAssetId(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem', padding: '8px', boxSizing: 'border-box' }}
          />
          <p><strong>Asset Manager Name</strong></p>
          <input
            type="text"
            value={assetManagerName}
            onChange={e => setAssetManagerName(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
          <button className="action-button" onClick={() => {
            if (!assetId || !assetManagerName) {
              alert('Bitte geben Sie eine Asset-ID und einen Asset Manager Name ein');
              return;
            }
            setFormData({ asset_id: assetId, asset_manager_name: assetManagerName });
            next();
          }}>
            Weiter ➔
          </button>
        </div>
      </div>
    );
  }

  const idx = currentIndex - 1;
  if (idx < points.length) {
    const point = points[idx];
    const selected = formData[point.point_id] || '';
    return (
      <div style={mainContainerStyle}>
        <div style={sidebarStyle}>
          <h3>Navigation</h3>
          <div style={{ marginBottom: '20px', fontSize: '14px' }}>
            Asset: <strong>{assetId}</strong><br />
            Manager: <strong>{assetManagerName}</strong>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Fortschritt: {Object.keys(formData).filter(k => !['asset_id','asset_manager_name'].includes(k) && !k.includes('_comment')).length}/{points.length}
            </div>
            <div style={{ background: '#e9ecef', height: '6px', borderRadius: '3px', marginTop: '5px' }}>
              <div style={{ background: '#28a745', height: '100%', width: `${(Object.keys(formData).filter(k => !['asset_id','asset_manager_name'].includes(k) && !k.includes('_comment')).length/points.length)*100}%` }} />
            </div>
          </div>
          {points.map((p, i) => {
            const done = Boolean(formData[p.point_id]);
            const isCurrent = i === idx;
            return (
              <div
                key={p.point_id}
                onClick={() => setCurrentIndex(i+1)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isCurrent ? '#007bff' : done ? '#28a745' : '#ffffff',
                  color: isCurrent || done ? '#ffffff' : '#2c3e50',
                  border: `1px solid ${isCurrent ? '#007bff' : done ? '#28a745' : '#dee2e6'}`,
                  fontSize: '13px',
                  lineHeight: '1.3'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  Point {i+1}{done && <span style={{ marginLeft: '8px' }}>({formData[p.point_id]})</span>}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  {p.libelle.length > 40 ? `${p.libelle.substring(0, 40)}...` : p.libelle}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginLeft: '300px', padding: '20px' }}>
          <h1>Point {currentIndex}/{points.length}: {point.libelle}</h1>
          <div className="buttons" style={{ marginTop: '1rem' }}>
            {[1,2,3,4,5,'N/A'].map(v => (
              <button key={v} className={selected===v?'selected':''} onClick={()=>handleRating(v)}>{v}</button>
            ))}
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label className="action-button" htmlFor="file-input">
              Photos hinzufügen ({currentFiles.length}/{MAX_FILES})
              <input id="file-input" type="file" accept="image/*" multiple hidden ref={fileInputRef} onChange={handleFileChange} />
            </label>
            {currentFiles.length > 0 && (
              <div style={{ marginTop: '1rem' }}>...</div>
            )}
          </div>
          <button className="action-button" onClick={getAdvice} style={{ marginTop: '1rem' }}>
            KI-Analyse ({currentFiles.length})
          </button>
          <textarea
            id="comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Kommentar hinzufügen..."
            style={{ width: '100%', minHeight: '100px', marginTop: '1rem', padding: '8px', boxSizing: 'border-box' }}
          />
          <div style={{ marginTop: '1rem' }}>
            <button className="action-button" onClick={() => {
              if (!formData[point.point_id]) {
                alert('Bitte wählen Sie eine Note aus');
                return;
              }
              setFormData(prev => ({
                ...prev,
                [`${point.point_id}_comment`]: comment
              }));
              setComment("");
              setCurrentFiles([]);
              if (fileInputRef.current) fileInputRef.current.value = "";
              next();
            }}>Weiter ➔</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={mainContainerStyle}>
      <div style={sidebarStyle}>...</div>
      <div style={{ marginLeft: '300px', padding: '20px' }}>
        <h2>Checklist abgeschlossen!</h2>
        <button className="action-button" onClick={submitAll}>✅ Daten senden</button>
      </div>
    </div>
  );
}

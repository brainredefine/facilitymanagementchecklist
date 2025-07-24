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

  // Styles for dark, discrete design
  const sidebarStyle = {
    width: '300px',
    background: '#2c2c2c',
    color: '#e0e0e0',
    borderRight: '1px solid #444',
    padding: '20px',
    overflowY: 'auto',
    position: 'fixed',
    height: '100vh',
    left: 0,
    top: 0,
  };
  const mainStyle = {
    marginLeft: '300px',
    padding: '20px',
    width: 'calc(100% - 300px)',
    background: '#1f1f1f',
    color: '#e0e0e0',
    minHeight: '100vh',
    boxSizing: 'border-box',
  };
  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    background: '#2c2c2c',
    padding: '20px',
    borderRadius: '8px',
  };

  if (submitted) {
    return <div style={{ ...mainStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✔️ Daten gesendet!</div>;
  }

  if (currentIndex === 0) {
    return (
      <div style={mainStyle}>
        <h1>Checklist Facility Management</h1>
        <div style={containerStyle}>
          <p><strong>Asset-ID (z.B. A1, B2…)</strong></p>
          <input
            type="text"
            value={assetId}
            onChange={e => setAssetId(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem', padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#1f1f1f', color: '#e0e0e0' }}
          />
          <p><strong>Asset Manager Name</strong></p>
          <input
            type="text"
            value={assetManagerName}
            onChange={e => setAssetManagerName(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#1f1f1f', color: '#e0e0e0' }}
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
      <div style={mainStyle}>
        <div style={sidebarStyle}>
          <h3>Navigation</h3>
          <div style={{ marginBottom: '20px' }}>
            Asset: <strong>{assetId}</strong><br />
            Manager: <strong>{assetManagerName}</strong>
          </div>
          <div style={{ marginBottom: '20px' }}>
            Fortschritt: {Object.keys(formData).filter(k => !['asset_id','asset_manager_name'].includes(k) && !k.includes('_comment')).length}/{points.length}
            <div style={{ background: '#444', height: '6px', borderRadius: '3px', marginTop: '5px' }}>
              <div style={{ background: '#0f8', height: '100%', width: `${(Object.keys(formData).filter(k => !['asset_id','asset_manager_name'].includes(k) && !k.includes('_comment')).length/points.length)*100}%` }} />
            </div>
          </div>
          {points.map((p, i) => {
            const done = Boolean(formData[p.point_id]);
            return (
              <div key={p.point_id} onClick={() => setCurrentIndex(i+1)} style={{ padding: '10px', marginBottom: '8px', borderRadius: '6px', cursor: 'pointer', background: done ? '#0a5' : 'transparent', color: done ? '#000' : '#e0e0e0' }}>
                {i+1}. {p.libelle}
              </div>
            );
          })}
        </div>
        <div style={containerStyle}>
          <h1>Point {currentIndex}/{points.length}</h1>
          <p>{point.libelle}</p>
          <div>
            {[1,2,3,4,5,'N/A'].map(v => (
              <button key={v} className={selected===v?'selected':''} onClick={()=>handleRating(v)} style={{ margin: '0 5px' }}>{v}</button>
            ))}
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label className="action-button" htmlFor="file-input">
              Photos ({currentFiles.length}/{MAX_FILES})
              <input id="file-input" type="file" accept="image/*" multiple hidden ref={fileInputRef} onChange={handleFileChange} />
            </label>
            {/* ... reste inchangé ... */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={mainStyle}>
      <div style={sidebarStyle}>
        <h3>Navigation</h3>
        {/* ... */}
      </div>
      <div style={{ ...containerStyle, marginLeft: '300px', marginTop: '50px' }}>
        <h2>Checklist terminé !</h2>
        <button onClick={submitAll}>Envoyer ✅</button>
      </div>
    </div>
  );
}

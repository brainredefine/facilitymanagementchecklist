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
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (currentFiles.length + files.length > MAX_FILES) {
      alert(`Vous ne pouvez télécharger que ${MAX_FILES} photos maximum. Actuellement: ${currentFiles.length}, tentative d'ajout: ${files.length}`);
      return;
    }
    setCurrentFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (indexToRemove) => {
    setCurrentFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
        currentFiles.map((file) => compressImage(file))
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
            onChange={(e) => setAssetId(e.target.value)}
            style={{ maxWidth: '100%', boxSizing: 'border-box', marginBottom: '1rem' }}
          />
          <p><strong>Asset Manager Name</strong></p>
          <input
            type="text"
            value={assetManagerName}
            onChange={(e) => setAssetManagerName(e.target.value)}
            style={{ maxWidth: '100%', boxSizing: 'border-box' }}
          />
          <button
            className="action-button"
            onClick={() => {
              if (!assetId || !assetManagerName) {
                alert('Bitte geben Sie eine Asset-ID und einen Asset Manager Name ein');
                return;
              }
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

  const idx = currentIndex - 1;
  if (idx < points.length) {
    const point = points[idx];
    const selected = formData[point.point_id] || '';
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div style={{
          width: '100px',
          padding: '20px',
          overflowY: 'auto',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          boxSizing: 'border-box'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>Navigation</h3>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '10px' }}>
              Asset: <strong>{assetId}</strong><br />
              Manager: <strong>{assetManagerName}</strong>
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>
              Fortschritt: {Object.keys(formData).filter(key => key !== 'asset_id' && key !== 'asset_manager_name' && !key.includes('_comment')).length}/{points.length}
            </div>
            <div style={{ background: '#e9ecef', height: '6px', borderRadius: '3px', marginTop: '10px' }}>
              <div style={{ background: '#28a745', height: '100%', borderRadius: '3px', width: `${(Object.keys(formData).filter(key => key !== 'asset_id' && key !== 'asset_manager_name' && !key.includes('_comment')).length / points.length) * 100}%`, transition: 'width 0.3s ease' }} />
            </div>
          </div>
          {points.map((p, i) => {
            const isCompleted = Boolean(formData[p.point_id]);
            const isCurrent = i === idx;
            return (
              <div
                key={p.point_id}
                onClick={() => setCurrentIndex(i + 1)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isCurrent ? '#007bff' : isCompleted ? '#28a745' : '#ffffff',
                  color: isCurrent || isCompleted ? 'white' : '#2c3e50',
                  border: `1px solid ${isCurrent ? '#007bff' : isCompleted ? '#28a745' : '#dee2e6'}`,
                  fontSize: '13px',
                  lineHeight: '1.3'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  Point {i + 1}{isCompleted && <span style={{ marginLeft: '8px' }}>({formData[p.point_id]})</span>}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  {p.libelle.length > 40 ? `${p.libelle.substring(0, 40)}...` : p.libelle}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginLeft: '50px', padding: '30px', width: 'calc(100%)' }}>
          <h1>Point {currentIndex}/{points.length}: {point.libelle}</h1>
          <div className="point-container" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
            <div className="buttons">
              {[1, 2, 3, 4, 5, 'N/A'].map((v) => (
                <button key={v} className={selected === v ? 'selected' : ''} onClick={() => handleRating(v)}>{v}</button>
              ))}
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label className="action-button" htmlFor="file-input">
                Photos hinzufügen ({currentFiles.length}/{MAX_FILES})
                <input id="file-input" type="file" accept="image/*" multiple hidden ref={fileInputRef} onChange={handleFileChange} />
              </label>
              {currentFiles.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p><strong>Ausgewählte Fotos:</strong></p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '0.5rem' }}>
                    {currentFiles.map((file, index) => (
                      <div key={index} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                        <button onClick={() => removeFile(index)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255, 0, 0, 0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Foto entfernen">×</button>
                        <p style={{ padding: '10px', margin: 0, fontSize: '12px', background: '#f5f5f5', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="action-button" onClick={getAdvice} style={{ marginTop: '1rem' }}>KI-Analyse {currentFiles.length > 0 && `(${currentFiles.length} Foto${currentFiles.length > 1 ? 's' : ''})`}</button>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
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
                boxSizing: 'border-box',
                resize: 'vertical',
                borderLeft: comment.includes('Note:') ? '4px solid #3b5998' : '1px solid #1a2a44'
              }}
            />
            <div style={{ marginTop: '1rem' }}>
              <button className="action-button" onClick={() => {
                if (!selected) {
                  alert('Bitte wählen Sie eine Note aus');
                  return;
                }
                setFormData((prev) => ({
                  ...prev,
                  [`${point.point_id}_comment`]: comment,
                }));
                setComment("");
                setCurrentFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
                next();
              }}>Weiter ➔</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{
        width: '600px',
        padding: '20px',
        overflowY: 'auto',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        boxSizing: 'border-box'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>Navigation</h3>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '10px' }}>Asset: <strong>{assetId}</strong><br />Manager: <strong>{assetManagerName}</strong></div>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Fortschritt: {Object.keys(formData).filter(key => key !== 'asset_id' && key !== 'asset_manager_name' && !key.includes('_comment')).length}/{points.length}</div>
          <div style={{ background: '#e9ecef', height: '6px', borderRadius: '3px', marginTop: '10px' }}>
            <div style={{ background: '#28a745', height: '100%', borderRadius: '3px', width: `${(Object.keys(formData).filter(key => key !== 'asset_id' && key !== 'asset_manager_name' && !key.includes('_comment')).length / points.length) * 100}%`, transition: 'width 0.3s ease' }} />
          </div>
        </div>
        {points.map((p, i) => (
          <div
            key={p.point_id}
            onClick={() => setCurrentIndex(i + 1)}
            style={{
              padding: '12px',
              marginBottom: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              background: formData[p.point_id] ? '#28a745' : '#ffffff',
              color: formData[p.point_id] ? '#fff' : '#2c3e50',
              border: `1px solid ${formData[p.point_id] ? '#28a745' : '#dee2e6'}`,
              fontSize: '13px',
              lineHeight: '1.3'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Point {i + 1}{formData[p.point_id] && <span style={{ marginLeft: '8px' }}>({formData[p.point_id]})</span>}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              {p.libelle.length > 40 ? `${p.libelle.substring(0, 40)}...` : p.libelle}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginLeft: '100px',
        padding: '20px',
        width: 'calc(100% - 100px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '30px', color: '#2c3e50' }}>Checklist abgeschlossen!</h2>
          <p style={{ marginBottom: '30px', color: '#6c757d' }}>Alle Punkte wurden bewertet. Sie können noch Änderungen vornehmen oder die Daten senden.</p>
          <button className="action-button" onClick={submitAll}>✅ Daten senden</button>
        </div>
      </div>
    </div>
  );
}
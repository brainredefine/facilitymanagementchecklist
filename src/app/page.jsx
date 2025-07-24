"use client";

import { useState, useEffect, useRef } from "react";
import Button from "../components/ui/button";

export default function FacilityChecklistForm() {
  const [assetId, setAssetId] = useState("");
  const [assetManagerName, setAssetManagerName] = useState("");
  const [points, setPoints] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [currentFiles, setCurrentFiles] = useState([]); // Changé de currentFile à currentFiles
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILES = 5; // Limite de 5 fichiers

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
    const files = Array.from(e.target.files);
    
    // Vérifier la limite de fichiers
    if (currentFiles.length + files.length > MAX_FILES) {
      alert(`Vous ne pouvez télécharger que ${MAX_FILES} photos maximum. Actuellement: ${currentFiles.length}, tentative d'ajout: ${files.length}`);
      return;
    }

    // Ajouter les nouveaux fichiers à la liste existante
    setCurrentFiles(prev => [...prev, ...files]);
  };

  // Supprimer un fichier spécifique
  const removeFile = (indexToRemove) => {
    setCurrentFiles(prev => prev.filter((_, index) => index !== indexToRemove));
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
    if (currentFiles.length === 0) return alert("Bitte laden Sie mindestens ein Foto hoch.");
    
    try {
      const point = points[currentIndex - 1];
      // Utiliser la première photo pour l'analyse IA
      const base64 = await compressImage(currentFiles[0]);
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

  // Saisie de l'assetId et assetManagerName
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
          
          {/* Section upload de fichiers */}
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
            
            {/* Affichage des fichiers sélectionnés */}
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
          <div style={{ marginTop: '1rem' }}>
            <button className="action-button" onClick={() => {
              if (!selected) return alert('Bitte wählen Sie eine Note aus');
              setFormData(prev => ({
                ...prev,
                [`${point.point_id}_comment`]: comment
              }));
              setComment('');
              setCurrentFiles([]); // Vider la liste des fichiers
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
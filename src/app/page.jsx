import { useState } from "react";
import { Button } from "@/components/ui/button";

const pointLabels = [
  "Fassade: Material und Zustand",
  // ... (reste de la liste)
];

export default function FacilityChecklistForm() {
  const [assetId, setAssetId] = useState("");
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState("");

  const handleChange = (pointKey, value) => {
    setFormData((prev) => ({ ...prev, [pointKey]: value }));
  };

  const handleFileChange = (e) => {
    setCurrentFile(e.target.files[0]);
  };

  const getAdvice = async (label) => {
    if (!currentFile) return alert("Veuillez uploader une photo.");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result.split(',')[1];
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, image: base64Image }),
      });
      const data = await response.json();
      setAiSuggestion(data);
    };
    reader.readAsDataURL(currentFile);
  };

  const handleSubmit = async () => {
    const payload = {
      asset_id: assetId,
      date: new Date().toISOString().split("T")[0],
    };
    pointLabels.forEach((_, index) => {
      payload[`point_${index + 1}`] = formData[`point_${index + 1}`] || "N/A";
    });

    await fetch("https://maxencegauthier.app.n8n.cloud/webhook/facilitymanagementchecklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitted(true);
  };

  if (submitted) {
    return <div className="p-4 text-green-600">✔️ Données envoyées avec succès !</div>;
  }

  return (
    <div className="p-4 max-w-xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Facility Management Checklist</h1>
      <input
        type="text"
        placeholder="Asset ID (ex: A1, B2...)"
        value={assetId}
        onChange={(e) => setAssetId(e.target.value)}
        className="w-full border rounded p-2"
      />
      {pointLabels.map((label, index) => {
        const pointKey = `point_${index + 1}`;
        return (
          <div key={pointKey} className="border rounded p-2">
            <p className="mb-2 font-medium">{label}</p>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, "N/A"].map((value) => (
                <Button
                  key={value}
                  variant={formData[pointKey] === value ? "default" : "outline"}
                  onClick={() => handleChange(pointKey, value)}
                >
                  {value}
                </Button>
              ))}
            </div>
            <div className="mt-2">
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <Button className="ml-2" onClick={() => getAdvice(label)}>Conseil IA</Button>
              {aiSuggestion && <p className="mt-2">{aiSuggestion}</p>}
            </div>
          </div>
        );
      })}
      <Button className="w-full" onClick={handleSubmit}>✅ Envoyer</Button>
    </div>
  );
}
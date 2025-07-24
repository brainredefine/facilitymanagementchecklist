export default async function handler(req, res) {
  // Autoriser uniquement les requêtes POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const { label, image, images } = req.body;

  // Déterminer si on a une seule image ou plusieurs
  const isMultipleImages = images && Array.isArray(images);
  const imagesToProcess = isMultipleImages ? images : [image];

  // Construire le contenu du message utilisateur
  const userContent = [
    { 
      type: 'text', 
      text: isMultipleImages 
        ? `Point: ${label}. Analysiere alle ${imagesToProcess.length} Bilder zusammen und schlage eine Note basierend auf dem Gesamtzustand vor.`
        : `Point: ${label}. Schlägt eine Note vor, die auf diesem Bild basiert.`
    }
  ];

  // Ajouter toutes les images au contenu
  imagesToProcess.forEach((img, index) => {
    if (img) { // Vérifier que l'image existe
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${img}` }
      });
    }
  });

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: isMultipleImages 
          ? 'Du bist ein Experte für Facility Management. Analysiere alle bereitgestellten Bilder zusammen und schlage eine Note von 1 bis 5 oder N/A für den angegebenen Punkt vor, basierend auf dem Gesamtzustand aller Bilder. Berücksichtige alle Details aus allen Bildern. Gib nur eine Note (1, 2, 3, 4, 5 oder N/A) und eine kurze Begründung (max. 80 Wörter) zurück. Format: "Note: X\\nBegründung: Text".'
          : 'Du bist ein Experte für Facility Management. Analysiere dieses Bild und schlage eine Note von 1 bis 5 oder N/A nur für den angegebenen Punkt vor, je nach dem beobachteten Zustand. Gib nur eine Note (1, 2, 3, 4, 5 oder N/A) und eine kurze Begründung (max. 50 Wörter) zurück. Format : "Note: X\\nBegründung: Text".'
      },
      {
        role: 'user',
        content: userContent
      }
    ],
    max_tokens: 500
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ error: errorData.error?.message || 'OpenAI API error' });
    }
    
    const data = await response.json();
    return res.status(200).json({ suggestion: data.choices[0].message.content.trim() });
  } catch (error) {
    console.error('API OpenAI error:', error);
    return res.status(500).json({ error: error.message });
  }
}
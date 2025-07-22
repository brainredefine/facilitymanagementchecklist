// src/pages/api/openai.js

export default async function handler(req, res) {
  // Autoriser uniquement les requêtes POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const { label, image } = req.body;

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Tu es un expert en facility management. Analyse cette image et suggère une note de 1 à 5 ou N/A uniquement pour le point spécifié, en fonction de l’état observé. Retourne uniquement une note (1, 2, 3, 4, 5 ou N/A) et une courte justification (max 50 mots). Format : "Note: X\\nJustification: Texte".'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Point: ${label}. Suggère une note basée sur cette image.` },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
        ]
      }
    ],
    max_tokens: 100
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
    const data = await response.json();
    return res.status(200).json({ suggestion: data.choices[0].message.content.trim() });
  } catch (error) {
    console.error('API OpenAI error:', error);
    return res.status(500).json({ error: error.message });
  }
}

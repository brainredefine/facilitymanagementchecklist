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
        content: 'Du bist ein Experte für Facility Management. Analysiere dieses Bild und schlage eine Note von 1 bis 5 oder N/A nur für den angegebenen Punkt vor, je nach dem beobachteten Zustand. Gib nur eine Note (1, 2, 3, 4, 5 oder N/A) und eine kurze Begründung (max. 50 Wörter) zurück. Format : "Note: X\\nBegründung: Text".'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Point: ${label}. Schlägt eine Note vor, die auf diesem Bild basiert.` },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
        ]
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
    const data = await response.json();
    return res.status(200).json({ suggestion: data.choices[0].message.content.trim() });
  } catch (error) {
    console.error('API OpenAI error:', error);
    return res.status(500).json({ error: error.message });
  }
}
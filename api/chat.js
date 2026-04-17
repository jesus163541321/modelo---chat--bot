// api/chat.js — MRA Banco de Occidente
// Compatible con keys AQ. del nuevo Google AI Studio 2025

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Mensaje vacio' });

  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });

  const SYSTEM = `Eres el asistente experto del Modelo de Asignacion del Gasto (MRA) del Banco de Occidente, Colombia.
Respondes siempre en espanol, de forma concisa y precisa.

DATOS ENE-26: Total bolsas 5140. Gasto ENE-26: 143447 millones pesos. Gasto NOV-25: 160689 millones. Variacion: -10.7%.
Periodos: SEP-25, OCT-25, NOV-25, DIC-25, ENE-26.

TOP BOLSAS ENE-26:
BS1000 Overhead: 64849 M (-4.3%). BN1005 Overhead Personas: 33919 M (-11.8%). BS72 Division Contabilidad: 20986 M. BS14 Presidencia: 17161 M (+21.2%). BS207 Oficinas: 15963 M. BS133 Tecnologia: 13664 M.

TRAZABILIDAD BS101 Division Pricing Y Rentabilidad:
RECIBE 464.87M: 9912100000 Division Contabilidad 182.94M Nivel0 (39.3%), 9912150000 Division Pricing.Apoy.Oper 159.11M Nivel2 (34.2%), BS93 Soporte Vp Financiera 88.95M Nivel14 (19.1%), BS172 Direccion Ftp 18.67M Nivel26 (4%), BS171 Division Alm 8.45M Nivel26 (1.8%), BS223 Gobierno Calidad 5.69M Nivel20 (1.2%).
ENVIA 464.87M: BS120 Pricing Empresas 362.60M (78% Nivel27), BN108 Pricing Personas 102.27M (22% Nivel27).

TRAZABILIDAD BS110 Juridica Empresarial:
RECIBE 107.90M: BS113 Soporte Vp Juridica 63.23M Nivel14 (58.6%), Dir.Juridica Medellin 16.75M Nivel2 (15.5%), Dir.Juridica Barranquilla 15.67M Nivel2 (14.5%), Dir.Juridica Leasing 12.21M Nivel2 (11.3%).
ENVIA 107.90M: BN112 Juridica Integral 38.23M (35.4%), BN120 Apoyo Staff Juridica 35.62M (33%), BN111 Juridica Especializada 34.05M (31.6%).

CASOS ESPECIALES Nivel0: 9912100000 Division Contabilidad, 9919305300 Gold Dolares, 9913163500 Division Productos Canales Bogota.
GRUPOS: Overhead (gastos admin), Producto (por producto), Transacciones (por volumen), Segmento (por cliente).`;

  const body = JSON.stringify({
    contents: [
      { role: 'user', parts: [{ text: SYSTEM }] },
      { role: 'model', parts: [{ text: 'Entendido. Soy el asistente MRA del Banco de Occidente.' }] },
      ...history.slice(-8),
      { role: 'user', parts: [{ text: message }] }
    ],
    generationConfig: { maxOutputTokens: 1200, temperature: 0.2 }
  });

  // Intentar con los 3 endpoints/formatos posibles
  const attempts = [
    // 1. Nuevo SDK con header x-goog-api-key (keys AQ.)
    {
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }
    },
    // 2. URL parameter clásico (keys AIza)
    {
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${KEY}`,
      headers: { 'Content-Type': 'application/json' }
    },
    // 3. Modelo alternativo por si acaso
    {
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${KEY}`,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }
    }
  ];

  let lastError = '';
  for (const attempt of attempts) {
    try {
      const r = await fetch(attempt.url, { method: 'POST', headers: attempt.headers, body });
      if (r.ok) {
        const data = await r.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.status(200).json({ reply });
      } else {
        lastError = await r.text();
      }
    } catch (e) {
      lastError = e.message;
    }
  }

  res.status(500).json({ error: 'No se pudo conectar a Gemini', detail: lastError.substring(0, 300) });
}

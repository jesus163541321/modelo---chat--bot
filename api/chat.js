// api/chat.js — Backend Vercel para Chatbot MRA Banco de Occidente
// Actualizado para el nuevo formato de keys AQ. de Google AI Studio 2025
// Variable de entorno requerida: GEMINI_API_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Mensaje vacío' });

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel' });

  const SYSTEM_CONTEXT = `Eres el asistente experto del Modelo de Asignacion del Gasto (MRA) del Banco de Occidente, Colombia.
Respondes preguntas de analistas y gerentes sobre el modelo. Siempre en espanol, conciso y preciso.

DATOS GENERALES ENE-26:
- Periodos disponibles: SEP-25, OCT-25, NOV-25, DIC-25, ENE-26
- Total bolsas: 5.140
- Gasto distribuido ENE-26: 143.447 millones de millones de pesos
- Gasto distribuido NOV-25: 160.689 millones de millones de pesos
- Variacion ENE-26 vs NOV-25: -10.7%

ESTRUCTURA: Centros de Costo reales → Bolsas de Soporte (BS) → Bolsas de Negocio (BN)

TOP BOLSAS ENE-26:
- BS1000 Overhead: 64.849 M (variacion -4.3%)
- BN1005 Overhead Segmento Personas: 33.919 M (variacion -11.8%)
- BS72 Division Contabilidad (S): 20.986 M
- BS14 Presidencia: 17.161 M (variacion +21.2%, mayor subida)
- BS207 Oficinas: 15.963 M
- BS133 Tecnologia: 13.664 M

TRAZABILIDAD BS101 - Division Pricing Y Rentabilidad:
  RECIBE 464.87M de:
  - 9912100000 Division Contabilidad: 182.94M (Nivel 0 Caso Especial, 39.3%)
  - 9912150000 Division Pricing.Apoy.Oper: 159.11M (Nivel 2, 34.2%)
  - BS93 Soporte Vp Financiera: 88.95M (Nivel 14, 19.1%)
  - BS172 Direccion Ftp Y Analisis: 18.67M (Nivel 26, 4%)
  - BS171 Division Alm: 8.45M (Nivel 26, 1.8%)
  - BS223 Gobierno Y Calidad: 5.69M (Nivel 20, 1.2%)
  ENVIA 464.87M a:
  - BS120 Pricing Empresas: 362.60M (78%, Nivel 27)
  - BN108 Pricing Personas: 102.27M (22%, Nivel 27)

TRAZABILIDAD BS110 - Juridica Empresarial:
  RECIBE 107.90M de:
  - BS113 Soporte Vp Juridica: 63.23M (Nivel 14, 58.6%)
  - 9915101000 Dir.Juridica Medellin: 16.75M (Nivel 2, 15.5%)
  - 9915101300 Dir.Juridica Barranquilla: 15.67M (Nivel 2, 14.5%)
  - 9915101695 Dir.Juridica Leasing: 12.21M (Nivel 2, 11.3%)
  ENVIA 107.90M a:
  - BN112 Juridica Integral: 38.23M (35.4%)
  - BN120 Apoyo Staff Juridica: 35.62M (33%)
  - BN111 Juridica Especializada: 34.05M (31.6%)

CASOS ESPECIALES (NIVEL 0): CeCos que envian gasto directo: 9912100000 Division Contabilidad, 9919305300 Gold Dolares, 9913163500 Division Productos Y Canales Bogota

REGLAS: Responde SIEMPRE en espanol. Usa negrita para bolsas y valores clave. Formato moneda: X.XXX M (millones). Menciona el nivel (N0, N2, N14...) al explicar trazabilidad.`;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_KEY
        },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: SYSTEM_CONTEXT }] },
            { role: 'model', parts: [{ text: 'Entendido. Soy el asistente del modelo MRA del Banco de Occidente. Puedo responder sobre trazabilidad, bolsas, variaciones y analisis de gasto.' }] },
            ...history.slice(-10),
            { role: 'user', parts: [{ text: message }] }
          ],
          generationConfig: {
            maxOutputTokens: 1500,
            temperature: 0.2
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error('Gemini ' + response.status + ': ' + errText.substring(0, 300));
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error('Respuesta vacia de Gemini');

    res.status(200).json({ reply });

  } catch (error) {
    console.error('Error chatbot MRA:', error.message);
    res.status(500).json({ error: 'Error al procesar tu pregunta', detail: error.message });
  }
}

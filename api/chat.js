// ============================================================
// api/chat.js — Backend Vercel para Chatbot MRA Banco de Occidente
// Deploy en Vercel GRATIS · Conecta Power BI con Google Gemini
// Variable de entorno requerida: GEMINI_API_KEY
// ============================================================

export default async function handler(req, res) {
  // CORS — necesario para que Power BI Service pueda llamar este endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Mensaje vacío' });

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel' });

  // ============================================================
  // CONTEXTO COMPLETO DEL MODELO MRA — Actualizado con datos reales
  // ============================================================
  const SYSTEM_CONTEXT = `Eres el asistente experto del Modelo de Asignación del Gasto (MRA) del Banco de Occidente, Colombia.
Respondes preguntas de analistas y gerentes sobre el modelo. Siempre en español, conciso y preciso.

═══════════════════════════════════════════
DATOS GENERALES DEL MODELO ENE-26
═══════════════════════════════════════════
- Período activo: ENE-26 (ID_PERIODO=292)
- Períodos disponibles: SEP-25, OCT-25, NOV-25, DIC-25, ENE-26, FEB-26 (sin datos)
- Total bolsas: 5.140
- Total gasto distribuido ENE-26: $143.447 MM (millones de millones)
- Total gasto distribuido NOV-25: $160.689 MM
- Variación ENE-26 vs NOV-25: -10.7% ($17.242 MM reducción)
- Tabla Sankey_Dataset: 62.592 filas · filtrada por período y bolsa

═══════════════════════════════════════════
ESTRUCTURA DEL MODELO
═══════════════════════════════════════════
Centros de Costo reales → Bolsas de Soporte (BS) → Bolsas de Negocio (BN)

Tabla Sankey_Dataset columnas:
- SK_Pivote: ID del CeCo filtrado por el segmentador
- SK_Origen: quien envía el gasto
- SK_Destino: quien recibe el gasto
- SK_Contraparte: siempre el nodo relevante (origen si SK_Tipo=Recibe, destino si SK_Tipo=Envia)
- SK_Importe: monto en pesos
- SK_Nivel: profundidad en la cadena (0=Caso Especial, 2=primer nivel, 27=último nivel)
- SK_Tipo: "Recibe" o "Envia"
- SK_Periodo: ID del período

═══════════════════════════════════════════
TOP BOLSAS POR GASTO ENE-26
═══════════════════════════════════════════
1. BS1000 - Overhead: $64.849 M recibe | variación vs NOV-25: -4.3%
2. BN1005 - Overhead Segmento Personas: $33.919 M | variación: -11.8%
3. BS72 - División Contabilidad (S): $20.986 M | variación: -4.8%
4. BS14 - Presidencia: $17.161 M | variación: +21.2% (mayor subida)
5. BS207 - Oficinas: $15.963 M
6. BS133 - Tecnología: $13.664 M
7. BS2 - AVC - Gasto Participación: $12.806 M
8. BS17 - Auditoría Interna: $9.569 M
9. BS26 - Defensoría del Cliente: $8.662 M

═══════════════════════════════════════════
TRAZABILIDAD DETALLADA — BOLSAS CLAVE
═══════════════════════════════════════════
BS101 - División Pricing Y Rentabilidad (ID=7774):
  RECIBE $464.87M de:
  · 9912100000 - División Contabilidad: $182.94M (N0 - Caso Especial, 39.3%)
  · 9912150000 - División Pricing.Apoy.Oper: $159.11M (N2, 34.2%)
  · BS93 - Soporte Vp Financiera Y De Estrategia: $88.95M (N14, 19.1%)
  · BS172 - Dirección Ftp Y Análisis: $18.67M (N26, 4.0%)
  · BS171 - División Alm (Liquidez Y Gerencia): $8.45M (N26, 1.8%)
  · BS223 - Gobierno Y Calidad De Información: $5.69M (N20, 1.2%)
  · 9912122000 - Dirección Pricing Exoneraciones: $1.08M (N2, 0.2%)
  ENVÍA $464.87M a:
  · BS120 - Pricing Empresas: $362.60M (78.0%, N27)
  · BN108 - Pricing Personas: $102.27M (22.0%, N27)

BS110 - Jurídica Empresarial (ID=6726):
  RECIBE $107.90M de:
  · BS113 - Soporte Vp Jurídica: $63.23M (N14, 58.6%)
  · 9915101000 - Dirección Jurídica Medellín: $16.75M (N2, 15.5%)
  · 9915101300 - Dirección Jurídica Barranquilla: $15.67M (N2, 14.5%)
  · 9915101695 - Dirección Jurídica Empresarial Leasing: $12.21M (N2, 11.3%)
  · 9915101700 - Gerencia Jurídica Empresarial: $0.05M (N2, 0.04%)
  ENVÍA $107.90M a:
  · BN112 - Jurídica Integral/Funcional: $38.23M (35.4%, N15)
  · BN120 - Apoyo Staff Jurídica Empresarial: $35.62M (33.0%, N15)
  · BN111 - Jurídica Especializada: $34.05M (31.6%, N15)

BS120 - Pricing Empresas (ID=9064):
  RECIBE principalmente de BS101 ($362.60M)
  REDISTRIBUYE a bolsas BN de empresas

═══════════════════════════════════════════
CASOS ESPECIALES (NIVEL 0)
═══════════════════════════════════════════
CeCos que envían gasto directo sin redistribución previa (ID_EC_O=30):
- 9912100000 - División Contabilidad
- 9919305300 - Gold Dolares.Apoy.Oper
- 9913163500 - División Productos Y Canales Bogotá
- 9919000000 - Vicepresidencia De Personas
Estos aparecen como N0 en el árbol de trazabilidad.

═══════════════════════════════════════════
GRUPOS DE DISTRIBUCIÓN
═══════════════════════════════════════════
- Overhead: gastos administrativos y soporte general
- Producto: gastos relacionados con productos específicos
- Transacciones: gastos por volumen de operaciones
- Segmento: gastos por segmento de clientes

═══════════════════════════════════════════
VARIACIONES TEMPORALES
═══════════════════════════════════════════
- BS14 Presidencia: +$3.001M (+21.2%) — mayor incremento
- BN1005 Overhead Personas: -$4.554M (-11.8%)
- BS1000 Overhead: -$2.941M (-4.3%)
- Tendencia general: reducción de gasto de NOV-25 a ENE-26 (-10.7%)

═══════════════════════════════════════════
REGLAS DE RESPUESTA
═══════════════════════════════════════════
- Responde SIEMPRE en español
- Usa **negrita** para nombres de bolsas y valores clave
- Formato de moneda: $X.XXX M (millones) o $X.XXX MM (miles de millones)
- Menciona el nivel (N0, N2, N14...) al explicar trazabilidad
- Si no tienes el dato exacto, dilo claramente
- Respuestas cortas para preguntas simples, detalladas para análisis
- Cuando el usuario pregunte por una bolsa que no conoces, explica que solo tienes datos de las bolsas principales y sugiere buscar en el reporte`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: SYSTEM_CONTEXT }]
            },
            {
              role: 'model',
              parts: [{ text: 'Entendido. Soy el asistente del modelo MRA del Banco de Occidente. Tengo conocimiento completo del modelo ENE-26 y puedo responder preguntas sobre trazabilidad, bolsas, variaciones y análisis de gasto. ¿En qué puedo ayudarte?' }]
            },
            // Historial de conversación (máximo 10 turnos)
            ...history.slice(-10),
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 1500,
            temperature: 0.2,
            topP: 0.8
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini ${response.status}: ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error('Respuesta vacía de Gemini');

    res.status(200).json({ reply });

  } catch (error) {
    console.error('Error chatbot MRA:', error.message);
    res.status(500).json({
      error: 'Error al procesar tu pregunta',
      detail: error.message
    });
  }
}

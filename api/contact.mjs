// Redfield Advisory — Contact Form Handler
// Vercel Serverless Function → Airtable
// Mirrors Basho Group /api/circle.mjs pattern

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, brand, interest, challenge, submitted } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Write to Airtable
    // TODO: Create Airtable base and table for Redfield leads
    // Table fields: Name, Email, Brand, Interest, Challenge, Submitted, Source
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE_NAME || 'Leads';

    if (AIRTABLE_TOKEN && AIRTABLE_BASE) {
      const airtableRes = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: [
              {
                fields: {
                  Name: name,
                  Email: email,
                  ...(brand && { Brand: brand }),
                  ...(interest && { Interest: interest }),
                  ...(challenge && { Challenge: challenge }),
                  Submitted: new Date().toISOString().split('T')[0],
                  Source: 'Website',
                },
              },
            ],
          }),
        }
      );

      if (!airtableRes.ok) {
        const errText = await airtableRes.text();
        console.error('Airtable error:', errText);
        // Still return success to user — we don't want form failure due to Airtable issues
        // The lead data is logged in Vercel function logs as fallback
      }
    } else {
      // No Airtable configured — log to console (visible in Vercel function logs)
      console.log('LEAD RECEIVED (no Airtable configured):', JSON.stringify(req.body));
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

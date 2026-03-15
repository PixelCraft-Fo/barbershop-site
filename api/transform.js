export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Not allowed' });

    const API_TOKEN = process.env.REPLICATE_API_TOKEN;

    try {
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + API_TOKEN,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        
        if (data.urls && data.urls.get) {
            let result = data;
            while (result.status !== 'succeeded' && result.status !== 'failed') {
                await new Promise(r => setTimeout(r, 2000));
                const poll = await fetch(data.urls.get, {
                    headers: { 'Authorization': 'Bearer ' + API_TOKEN }
                });
                result = await poll.json();
            }
            return res.status(200).json(result);
        }
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Not allowed' });

    const API_TOKEN = process.env.REPLICATE_API_TOKEN;

    try {
        const body = req.body;
        
        // Upload base64 image to Replicate file hosting
        const base64Data = body.image.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        const uploadResponse = await fetch('https://api.replicate.com/v1/files', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + API_TOKEN,
                'Content-Type': 'application/octet-stream',
            },
            body: imageBuffer
        });
        
        const uploadResult = await uploadResponse.json();
        const imageUrl = uploadResult.urls.get;
        
        // Now run the model with the uploaded image URL
        const response = await fetch('https://api.replicate.com/v1/models/flux-kontext-apps/change-haircut/predictions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + API_TOKEN,
                'Content-Type': 'application/json',
                'Prefer': 'wait'
            },
            body: JSON.stringify({
                input: {
                    input_image: imageUrl,
                    haircut_style: body.style,
                    hair_color: body.color || 'No change',
                    gender: 'male'
                }
            })
        });

        let result = await response.json();

        if (result.urls && result.urls.get && result.status !== 'succeeded' && result.status !== 'failed') {
            while (result.status !== 'succeeded' && result.status !== 'failed') {
                await new Promise(r => setTimeout(r, 2000));
                const poll = await fetch(result.urls.get, {
                    headers: { 'Authorization': 'Bearer ' + API_TOKEN }
                });
                result = await poll.json();
            }
        }

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

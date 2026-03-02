import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 3001;

app.use(express.json());

app.post('/api/sec', async (req, res) => {
    const { url, headers } = req.body;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const response = await fetch(url, {
            headers: {
                ...headers,
                'User-Agent': 'ValuWise/1.0 contact@valuwise.app',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to fetch data from SEC');
    }
});

app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
});

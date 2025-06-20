// server.js
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3001;

const PRINTFUL_API_KEY = 'aiqktosa-qxbm-f59o:8k4y-7sxzaasxu0nw';
const base64Key = Buffer.from(PRINTFUL_API_KEY).toString('base64');

app.use(express.static('public')); // Serve merch.html from /public folder

app.get('/api/products', async (req, res) => {
  try {
    const response = await fetch('https://api.printful.com/store/products', {
      headers: {
        Authorization: `Basic ${base64Key}`
      }
    });
    const data = await response.json();
    res.json(data.result); // return product list
  } catch (error) {
    console.error('Printful API error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// api/products.js
export default async function handler(req, res) {
  const apiKey = process.env.PRINTFUL_API_KEY;

  const response = await fetch("https://api.printful.com/store/products", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch products from Printful");
    return res.status(500).json({ error: "Failed to fetch products" });
  }

  const data = await response.json();
  return res.status(200).json(data.result);
}


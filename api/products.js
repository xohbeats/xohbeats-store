// api/products.js
export default async function handler(req, res) {
  const apiKey = process.env.PRINTFUL_API_KEY;

  try {
    const response = await fetch("https://api.printful.com/store/products", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error("Printful API Error:", await response.text());
      return res.status(500).json({ error: "Failed to fetch products" });
    }

    const data = await response.json();

    // Filter only the known products by name or ID
    const filtered = data.result.filter((product) =>
      [
        "Space Ranger",
        "Rambo Camo",
        "Built Different, Looped Better",
        "Still Alive",
        "The Masked Musician",
      ].includes(product.name)
    );

    return res.status(200).json(filtered);
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

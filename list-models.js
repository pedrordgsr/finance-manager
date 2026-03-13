require("dotenv").config();

async function listAllModels() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  try {
    console.log("Listing available models using native fetch...");
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
        console.error("API Error:", data.error.message);
        console.log("Full error data:", JSON.stringify(data.error, null, 2));
    } else {
        console.log("Available models:");
        if (data.models && data.models.length > 0) {
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("No models returned. Response:", JSON.stringify(data, null, 2));
        }
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

listAllModels();

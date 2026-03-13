const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Attempting to list models...");
    // There isn't a direct listModels in the simple SDK easily accessible without extra auth usually
    // but we can try a simple generateContent to see if it even connects.
    const result = await model.generateContent("Oi");
    console.log("Success with gemini-1.5-flash");
  } catch (e) {
    console.error("Error:", e.message);
    if (e.message.includes("404")) {
        console.log("Model 404ed. Trying gemini-pro...");
        const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
        try {
            await model2.generateContent("Oi");
            console.log("Success with gemini-pro");
        } catch (e2) {
            console.error("Error with gemini-pro:", e2.message);
        }
    }
  }
}

listModels();

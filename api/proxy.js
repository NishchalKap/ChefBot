    // File: /api/proxy.js
    // This code runs on a server, not in the browser.

    export default async function handler(request, response) {
      // Only allow POST requests for security
      if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
      }

      const { prompt } = request.body;
      if (!prompt) {
        return response.status(400).json({ error: 'Prompt is required' });
      }

      // Securely read the API key from the server's environment variables.
      // This key is NEVER sent to the user's browser.
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

      if (!GEMINI_API_KEY) {
        return response.status(500).json({ error: 'API key not configured on the server.' });
      }

      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

      try {
        // Call the actual Google AI service
        const aiResponse = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          }),
        });

        if (!aiResponse.ok) {
            const errorData = await aiResponse.json();
            console.error('Error from Google AI:', errorData);
            return response.status(aiResponse.status).json({ error: errorData });
        }

        const aiData = await aiResponse.json();
        
        // Check for a valid response structure before sending it back
        if (aiData.candidates && aiData.candidates[0] && aiData.candidates[0].content && aiData.candidates[0].content.parts[0]) {
            const botText = aiData.candidates[0].content.parts[0].text;
            return response.status(200).json({ response: botText });
        } else {
            console.error('Unexpected response structure from AI:', aiData);
            return response.status(500).json({ error: 'Invalid response structure from AI.' });
        }

      } catch (error) {
        console.error('Proxy Error:', error);
        return response.status(500).json({ error: 'Failed to fetch response from AI' });
      }
    }
    

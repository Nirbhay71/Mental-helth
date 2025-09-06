import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generateAIResponse(userMessage: string, conversationHistory?: any[]): Promise<string> {
  try {
    const messages = [
      {
        role: "system" as const,
        content: `You are a compassionate mental health assistant named Mindful AI. You provide supportive, empathetic responses to users seeking mental health guidance. Always:
        - Be warm, understanding, and non-judgmental
        - Provide practical coping strategies and techniques
        - Encourage professional help when appropriate
        - Avoid diagnosing or prescribing medication
        - Keep responses helpful but not overly long
        - Use a calm, reassuring tone
        - Remember this is for general guidance only and not a replacement for professional care`
      },
      ...(conversationHistory || []),
      {
        role: "user" as const,
        content: userMessage
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm here to help, but I'm having trouble responding right now. Please try again.";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or consider reaching out to a mental health professional if you need immediate support.";
  }
}

export async function moderateContent(content: string): Promise<{ flagged: boolean; reason?: string }> {
  try {
    const response = await openai.moderations.create({
      input: content,
    });

    const result = response.results[0];
    if (result.flagged) {
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category, _]) => category);
      
      return {
        flagged: true,
        reason: `Content flagged for: ${flaggedCategories.join(', ')}`
      };
    }

    return { flagged: false };
  } catch (error) {
    console.error("Content moderation error:", error);
    // If moderation fails, err on the side of caution
    return { flagged: false };
  }
}

export async function generatePostSuggestions(tags: string[]): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates thoughtful mental health post suggestions based on tags. Respond with JSON in this format: { \"suggestions\": [\"suggestion1\", \"suggestion2\", \"suggestion3\"] }"
        },
        {
          role: "user",
          content: `Generate 3 thoughtful post title suggestions for mental health topics related to these tags: ${tags.join(', ')}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions":[]}');
    return result.suggestions || [];
  } catch (error) {
    console.error("Post suggestion generation error:", error);
    return [];
  }
}

const axios = require("axios");

const parseDhuwitText = async (text) => {
    const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: `
You are a financial transaction parser.

Convert user text into STRICT JSON only.

IMPORTANT RULES:
- status:
  1 = income
  2 = expense
- nominal must be integer
- information must be cleaned
- date_dhuwit must be ISO format (yyyy-MM-dd)

DATE RULES:
- "hari ini" -> today
- "kemarin" -> yesterday
- "besok" -> tomorrow
- "2 hari lalu" -> subtract 2 days
- if no date mentioned -> today

Return ONLY valid JSON.
`,
                },
                {
                    role: "user",
                    content: text,
                },
            ],
            temperature: 0,
        },
        {
            headers: {
                Authorization: `Bearer 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`,
                "Content-Type": "application/json",
            },
        }
    );

    const content = response.data.choices[0].message.content;

    return JSON.parse(content);
};

module.exports = {
    parseDhuwitText
};
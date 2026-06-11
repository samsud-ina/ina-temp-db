const axios = require("axios");

const parseDhuwitText = async (text) => {
    const response = await axios.post(
        `${process.env.ZAI_BASE_URL}/chat/completions`,
        {
            model: "glm-5.1",
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
- nominal must be integer (no currency text, no dots, no commas)
- information must be cleaned (remove numbers and date words)
- date_dhuwit must be ISO format (yyyy-MM-dd)

DATE RULES:
- "hari ini" → today
- "kemarin" → yesterday
- "lusa" → tomorrow
- "2 hari lalu" → subtract 2 days
- if no date mentioned → today

OUTPUT FORMAT (STRICT):
{
  "nominal": number,
  "status": number,
  "information": string,
  "date_dhuwit": "yyyy-MM-dd"
}

Return ONLY JSON. No explanation. No markdown.
          `
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.ZAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    const content = response.data.choices[0].message.content;

    return JSON.parse(content);
};

module.exports = {
    parseDhuwitText
};
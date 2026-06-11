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

Your task is to convert a user's natural language into a VALID JSON object.

Current date: {{CURRENT_DATE}}

RULES:

1. status
- 1 = income
- 2 = expense

2. nominal
- Must be an integer.
- Never include currency symbols.
- Never include dots or commas.
- Convert:
  - 10rb -> 10000
  - 10 ribu -> 10000
  - 1 juta -> 1000000
  - 1.5 juta -> 1500000
  - 1,5 juta -> 1500000

3. information
- Remove date expressions.
- Remove nominal values.
- Keep the action if meaningful.
- Examples:
  "saya beli ayam 10000" -> "beli ayam"
  "bayar listrik 300 ribu" -> "bayar listrik"
  "gaji bulanan 5 juta" -> "gaji bulanan"

4. date_dhuwit
Must use yyyy-MM-dd format.

Relative dates:
- hari ini = current date
- kemarin = current date - 1 day
- besok = current date + 1 day
- lusa = current date + 2 days
- X hari lalu = current date - X days
- X hari lagi = current date + X days

If no date is mentioned:
use current date.

5. If status cannot be determined:
default to expense (2).

OUTPUT:

{
  "nominal": integer,
  "status": 1|2,
  "information": "string",
  "date_dhuwit": "yyyy-MM-dd"
}
Return ONLY valid JSON.

Do NOT wrap in markdown.
Do NOT explain.
Do NOT output any extra text.
The response must be directly parseable by JSON.parse().
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
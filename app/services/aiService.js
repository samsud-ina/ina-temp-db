const axios = require("axios");

const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
});
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

Your ONLY task is to convert a user's natural language transaction into ONE valid JSON object.

Current date in Indonesia (Asia/Jakarta): ${today}

IMPORTANT:
- Treat the date above as the absolute truth.
- All relative dates MUST be calculated from that date.
- Never invent another current date.
- Never assume another year.

DATE RULES:
- "hari ini" = current date
- "kemarin" = current date - 1 day
- "besok" = current date + 1 day
- "lusa" = current date + 2 days
- "X hari lalu" = current date - X days
- "X hari lagi" = current date + X days

If no date is mentioned:
- Use the current date above.

STATUS DETECTION RULES:
- If the text indicates money received or earned -> status = 1.
- If the text indicates money spent or paid -> status = 2.
- Examples of income words: gaji, bonus, jual, menjual, pendapatan, pemasukan, menerima.
- Examples of expense words: beli, bayar, tagihan, cicilan, top up.
- Only if it is still ambiguous, default to 2.

NOMINAL RULES:
- Must be an integer.
- Never include currency symbols.
- Never include dots or commas.
- Convert naturally:
  - 10rb -> 10000
  - 10 rb -> 10000
  - 10 ribu -> 10000
  - 100 ribu -> 100000
  - 1 juta -> 1000000
  - 1.5 juta -> 1500000
  - 1,5 juta -> 1500000
  - 2 juta 500 ribu -> 2500000

INFORMATION RULES:
- Remove all date expressions.
- Remove all nominal values.
- Keep meaningful action words.
- Keep the description natural.
- Do NOT leave numbers in the information field.

Examples:
"saya beli ayam 10000"
-> "beli ayam"

"kemarin bayar listrik 300 ribu"
-> "bayar listrik"

"gaji bulanan 5 juta"
-> "gaji bulanan"

"bonus kantor 1 juta"
-> "bonus kantor"

OUTPUT SCHEMA:

{
  "nominal": integer,
  "status": 1,
  "information": "string",
  "date_dhuwit": "yyyy-MM-dd"
}

or

{
  "nominal": integer,
  "status": 2,
  "information": "string",
  "date_dhuwit": "yyyy-MM-dd"
}

OUTPUT RULES:
- Return ONLY valid JSON.
- Do NOT return markdown.
- Do NOT include explanations.
- Do NOT include comments.
- Do NOT include extra text.
- The response must be directly parseable by JSON.parse().
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
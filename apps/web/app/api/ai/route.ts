import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Use environment variable or fallback to localhost
        // Note: 'localhost' inside Docker/Container might need specific handling, 
        // but assuming this runs where the user ran `npm run dev` on Windows, localhost is fine.
        const AI_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:1234/v1/chat/completions';

        console.log('Proxying AI request to:', AI_URL);

        const response = await fetch(AI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            console.error('AI Service Error:', response.status, response.statusText);
            return NextResponse.json({ error: `AI Service Error: ${response.statusText}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: `Internal Proxy Error: ${error.message}` }, { status: 500 });
    }
}

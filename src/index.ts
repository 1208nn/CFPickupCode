const MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8';

const SYSTEM_PROMPT = `You are a courier pickup code extractor.
Your only job is to find and return the pickup code from the user's message.
Pickup codes are short alphanumeric strings (commonly formatted as short segmented groups (hyphenated or grouped) or as a compact 6-character code) used to collect parcels from courier stations or lockers. They may also be called 取件码 (in context of parcel pickup), or similar.
Rules:
- If you find a pickup code, respond with ONLY the code itself, no explanation, no punctuation, no extra text.
- If there is no pickup code in the message, respond with exactly: false`;

function unauthorized(): Response {
	return new Response(JSON.stringify({ error: 'Unauthorized' }), {
		status: 401,
		headers: { 'Content-Type': 'application/json' },
	});
}

function badRequest(message: string): Response {
	return new Response(JSON.stringify({ error: message }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' },
	});
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// Only accept POST
		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
				status: 405,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Auth check via Bearer token
		const authHeader = request.headers.get('Authorization') ?? '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
		if (!env.API_KEY || token !== env.API_KEY) {
			return unauthorized();
		}

		// Parse body
		let text: string;
		const contentType = request.headers.get('Content-Type') ?? '';
		if (contentType.includes('application/json')) {
			let body: unknown;
			try {
				body = await request.json();
			} catch {
				return badRequest('Invalid JSON');
			}
			if (typeof body !== 'object' || body === null || typeof (body as Record<string, unknown>).text !== 'string') {
				return badRequest('Body must be JSON with a "text" string field');
			}
			text = (body as { text: string }).text;
		} else {
			text = await request.text();
		}

		if (!text.trim()) {
			return badRequest('Empty text');
		}

		// Call CF AI
		const response = await env.AI.run(MODEL, {
			messages: [
				{ role: 'system', content: SYSTEM_PROMPT },
				{ role: 'user', content: text },
			],
		});

		const raw = (response as { response?: string }).response?.trim() ?? 'false';
		const result = raw === 'false' ? false : raw;

		return new Response(JSON.stringify({ result }), {
			headers: { 'Content-Type': 'application/json' },
		});
	},
} satisfies ExportedHandler<Env>;

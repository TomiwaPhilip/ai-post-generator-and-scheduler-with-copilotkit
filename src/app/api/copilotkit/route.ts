import { CopilotRuntime, GoogleGenerativeAIAdapter } from "@copilotkit/backend";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";

export async function POST(req: Request): Promise<Response> {
    try {
        const copilotKit = new CopilotRuntime({});
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const geminiModel = process.env.GEMINI_MODEL;

        if (!geminiApiKey || !geminiModel) {
            throw new Error("Gemini API Key or Model is not provided!");
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: geminiModel });

        const adapter = new GoogleGenerativeAIAdapter({ model });
        return copilotKit.response(req, adapter);
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

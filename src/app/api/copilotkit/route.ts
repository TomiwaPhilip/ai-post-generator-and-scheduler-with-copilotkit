import { CopilotRuntime, GoogleGenerativeAIAdapter } from "@copilotkit/backend";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import axios from "axios";

export const runtime = "edge";

export async function POST(req: Request): Promise<Response> {
    try {

        const response = await axios.get('https://api.ipify.org?format=json');
        console.log(`Public IP Address: ${response.data.ip}`);

        const copilotKit = new CopilotRuntime({});

        const adapter = new GoogleGenerativeAIAdapter();
        return copilotKit.response(req, adapter);
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

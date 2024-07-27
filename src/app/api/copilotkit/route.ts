import { NextRequest } from "next/server";
import {
    CopilotRuntime,
    GoogleGenerativeAIAdapter,
    copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const POST = async (req: NextRequest) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL;

    if (!geminiApiKey || !geminiModel) {
        return new Response(JSON.stringify({ error: "Gemini API Key or Model is not provided!" }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: geminiModel });

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
        runtime: new CopilotRuntime(),
        serviceAdapter: new GoogleGenerativeAIAdapter({ model }),
        endpoint: req.nextUrl.pathname,
    });

    return handleRequest(req);
};

import { CopilotRuntime, GoogleGenerativeAIAdapter } from "@copilotkit/backend";

export const runtime = "edge";

export async function POST(req: Request): Promise<Response> {
    try {

        const copilotKit = new CopilotRuntime({});

        const adapter = new GoogleGenerativeAIAdapter();
        return copilotKit.response(req, adapter);
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

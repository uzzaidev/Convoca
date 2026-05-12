import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY não configurado");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export function getAgentModel(): string {
  return process.env.AGENT_MODEL ?? "gpt-5.4-nano";
}

export function getMcpPublicUrl(): string {
  const url = process.env.MCP_PUBLIC_URL;
  if (!url) throw new Error("MCP_PUBLIC_URL não configurado");
  return url;
}

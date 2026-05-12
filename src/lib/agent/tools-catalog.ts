import { z } from "zod";
import type { AgentSessionPayload } from "@/lib/agent/session-token";

export type ToolKind = "read" | "write";
export type ToolMinRole = "member" | "admin";

export interface ToolContext extends AgentSessionPayload {}

export interface AgentTool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  kind: ToolKind;
  minRole: ToolMinRole;
  handler: (ctx: ToolContext, args: TInput) => Promise<TOutput>;
}

// Registry global de tools — populado por cada arquivo de tools
const registry = new Map<string, AgentTool>();

export function registerTool<TInput = unknown, TOutput = unknown>(tool: AgentTool<TInput, TOutput>): void {
  registry.set(tool.name, tool as AgentTool);
}

export function getTool(name: string): AgentTool | undefined {
  return registry.get(name);
}

export function listTools(role: "admin" | "member"): AgentTool[] {
  return Array.from(registry.values()).filter(
    (t) => role === "admin" || t.minRole === "member"
  );
}

/** Converte uma tool para o formato JSON Schema usado pelo MCP */
export function toolToMcpDefinition(tool: AgentTool): object {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: zodToJsonSchema(tool.inputSchema),
  };
}

/** Converte schema Zod simples para JSON Schema (subset usado aqui) */
function zodToJsonSchema(schema: z.ZodType): object {
  // Extrai o schema interno de ZodEffects
  const inner =
    schema instanceof z.ZodEffects ? schema._def.schema : schema;

  if (inner instanceof z.ZodObject) {
    const shape = inner.shape as Record<string, z.ZodType>;
    const properties: Record<string, object> = {};
    const required: string[] = [];

    for (const [key, val] of Object.entries(shape)) {
      properties[key] = zodFieldToJsonSchema(val);
      if (!(val instanceof z.ZodOptional) && !(val instanceof z.ZodDefault)) {
        required.push(key);
      }
    }

    return { type: "object", properties, required };
  }

  return { type: "object" };
}

function zodFieldToJsonSchema(field: z.ZodType): object {
  if (field instanceof z.ZodOptional) {
    return zodFieldToJsonSchema(field.unwrap());
  }
  if (field instanceof z.ZodDefault) {
    return zodFieldToJsonSchema(field._def.innerType);
  }
  if (field instanceof z.ZodString) {
    return { type: "string", description: field.description };
  }
  if (field instanceof z.ZodNumber) {
    return { type: "number", description: field.description };
  }
  if (field instanceof z.ZodBoolean) {
    return { type: "boolean" };
  }
  if (field instanceof z.ZodEnum) {
    return { type: "string", enum: field.options };
  }
  if (field instanceof z.ZodArray) {
    return { type: "array", items: zodFieldToJsonSchema(field.element) };
  }
  return { type: "string" };
}

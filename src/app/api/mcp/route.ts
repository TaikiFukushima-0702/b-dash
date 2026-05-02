import { NextResponse } from "next/server";
import { tools } from "@/lib/mcp/tools";

/**
 * MCP server (Streamable HTTP transport, stateless mode).
 *
 * Auth: bearer token via `Authorization: Bearer <MCP_BEARER_TOKEN>`.
 * Spec: https://spec.modelcontextprotocol.io/specification/server/transport/
 */

const PROTOCOL_VERSION = "2025-03-26";

function checkAuth(req: Request): boolean {
  const expected = process.env.MCP_BEARER_TOKEN;
  if (!expected) return false;
  const header = req.headers.get("authorization") ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  return !!m && m[1] === expected;
}

function rpcResult(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handleRpc(req: any) {
  const { id, method, params } = req;
  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "b-dash", version: "0.1.0" },
      });
    case "notifications/initialized":
      return null; // notification — no response
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, {
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });
    case "tools/call": {
      const { name, arguments: args } = params ?? {};
      const tool = tools.find((t) => t.name === name);
      if (!tool) return rpcError(id, -32601, `Unknown tool: ${name}`);
      try {
        const data = await tool.handler(args ?? {});
        return rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        });
      } catch (e: any) {
        return rpcResult(id, {
          isError: true,
          content: [{ type: "text", text: `Error: ${e?.message ?? String(e)}` }],
        });
      }
    }
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json(rpcError(null, -32700, "Parse error"));

  // Support batch requests
  if (Array.isArray(body)) {
    const results = await Promise.all(body.map(handleRpc));
    const filtered = results.filter((r) => r !== null);
    return NextResponse.json(filtered);
  }
  const result = await handleRpc(body);
  if (result === null) return new Response(null, { status: 202 });
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  // Discoverability: return server info on GET (without auth, just metadata).
  return NextResponse.json({
    name: "b-dash",
    version: "0.1.0",
    transport: "streamable-http (stateless)",
    protocolVersion: PROTOCOL_VERSION,
    auth: "Bearer token via Authorization header",
  });
}

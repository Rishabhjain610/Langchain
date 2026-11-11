import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-app/1.0";

const server=new McpServer({
  name:"weather-app",
  description:"A simple weather app that fetches weather data from the National Weather Service API.",
  version:"1.0.0",
})
server.registerTool(
  "addition",
  {
    description: "This tool adds two numbers together.",
    inputSchema: z.object({
      a: z.number(),
      b: z.number(),
    }),
    outputSchema: z.object({
      result: z.number(),
    }),
  },
  async ({ a, b }) => {
    const output = { result: a + b };
    return {
      content: [{ type: "text", text: `The result of adding ${a} and ${b} is ${String(output.result)}` }],
      structuredContent: output,
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
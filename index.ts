import { RailwayWebhook } from "./type.ts";

const feishuBotId = Deno.env.get("FEISHU_BOT_ID");

async function sendToFeishu(message: string) {
  const url = "https://open.feishu.cn/open-apis/bot/v2/hook/" + feishuBotId;
  const body = {
    msg_type: "text",
    content: {
      text: message,
    },
  };
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

const server = Deno.listen({ port: 80 });
for await (const conn of server) {
  serveHttp(conn);
}

async function serveHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    const { request, respondWith } = requestEvent;

    if (request.method !== "POST") {
      respondWith(
        new Response("Get", {
          status: 200,
        })
      );
    } else {
      const body = await request.json();
      console.log(body);
      const webhook = body as RailwayWebhook;
      const message = `Railway ${webhook.type} by ${webhook.deployment.creator.name} in ${webhook.environment.name} of ${webhook.project.name} at ${webhook.timestamp}`;
      await sendToFeishu(message);
      respondWith(
        new Response("Post", {
          status: 200,
        })
      );
    }
  }
}

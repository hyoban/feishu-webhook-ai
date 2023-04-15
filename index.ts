import { RailwayWebhook } from "./type.ts";

// read feishu bot id from env

const feishuBotId = Deno.env.get("FEISHU_BOT_ID");

// send a message to feishu robot
// curl -X POST -H "Content-Type: application/json" -d "{\"msg_type\":\"text\",\"content\":{\"text\":\"\"}}" https://open.feishu.cn/open-apis/bot/v2/hook/

async function sendToFeishu(message: string) {
  const url = "https://open.feishu.cn/open-apis/bot/v2/hook/" + feishuBotId;
  const body = {
    msg_type: "text",
    content: {
      text: message,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  console.log(res);
}

// create a server to receive railway webhooks

const server = Deno.listen({ port: 80 });

// Connections to the server will be yielded up as an async iterable.
for await (const conn of server) {
  // In order to not be blocking, we need to handle each connection individually
  // without awaiting the function
  serveHttp(conn);
}

async function serveHttp(conn: Deno.Conn) {
  // This "upgrades" a network connection into an HTTP connection.
  const httpConn = Deno.serveHttp(conn);
  // Each request sent over the HTTP connection will be yielded as an async
  // iterator from the HTTP connection.
  for await (const requestEvent of httpConn) {
    // The native HTTP server uses the web standard `Request` and `Response`
    // objects.
    const { request, respondWith } = requestEvent;

    if (request.method !== "POST") {
      respondWith(
        new Response("Get", {
          status: 200,
        }),
      );
    } else {
      const body = await request.json();
      console.log(body);
      const webhook = body as RailwayWebhook;
      const message = `Railway Deployment: ${webhook.deployment.id} by ${webhook.deployment.creator.name} in ${webhook.environment.name} of ${webhook.project.name} at ${webhook.timestamp}`;
      console.log(message);
      await sendToFeishu(message);
      respondWith(
        new Response("Post", {
          status: 200,
        }),
      );
    }
  }
}

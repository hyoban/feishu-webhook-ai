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
      const message = `Railway 项目 ${webhook.project.name} 的 ${webhook.environment.name} 环境 的 ${webhook.service.name} 服务部署状态变更为 ${webhook.status}。相关的 commit 信息为：${webhook.deployment.meta.commitMessage}。`;
      await sendToFeishu(message);
      respondWith(
        new Response("Post", {
          status: 200,
        })
      );
    }
  }
}

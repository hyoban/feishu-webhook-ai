const openAIKey = Deno.env.get("OPENAI_KEY");
const feishuBotId = Deno.env.get("FEISHU_BOT_ID");

async function requestOpenAI(prompt: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAIKey}`,
    },
    method: "POST",
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `你是一个webhook机器人，接收一个json字符串作为输入，
            其内容一般为代码的编译部署进度状态信息或其他通知信息。
            你需要从中获取尽可能多的的信息，将其转换为一句便于人类阅读了解的通知信息。
            如果存在的话，希望你至少包含时间，项目名称，相关的 git commit message，
            当前部署的状态（开始编译，正在部署，已部署成功或者其他状态），部署的服务、环境等信息。
            请注意，不止于这些，你需要将全部其他你觉得有价值的信息都包含在内。
            然后你需要将这些信息转换为一个通知，作为回复。
            以下是输入的json：${prompt}`,
        },
      ],
    }),
  });

  const data = await res.json();
  return data.choices[0].message.content;
}

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
        new Response("Not Post", {
          status: 200,
        })
      );
    } else {
      const body = await request.json();
      console.log(body);
      const webhook = body;
      const message = await requestOpenAI(JSON.stringify(webhook));
      await sendToFeishu(message);
      respondWith(
        new Response("Post", {
          status: 200,
        })
      );
    }
  }
}

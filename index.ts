const openAIKey = Deno.env.get("OPENAI_KEY");
const feishuBotId = Deno.env.get("FEISHU_BOT_ID");

interface Notification {
  project?: string;
  time?: string;
  status?: string;
  author?: string;
  message?: string;
}

function constructNotificationText(content: Notification) {
  const { project, time, status, author, message } = content;
  const notificationText = `项目 ${project} 在 ${time} 时 ${status}，提交者为 ${author}，提交信息为 ${message}`;
  return notificationText;
}

async function requestOpenAI(prompt: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAIKey}`,
    },
    method: "POST",
    body: JSON.stringify({
      model: "gpt-3.5-turbo-0613",
      messages: [
        {
          role: "user",
          content: `The following is a json object that contains the information of a project's notification: ${prompt}`,
        },
      ],
      functions: [
        {
          name: "constructNotificationText",
          description: "Construct a notification text from a json object",
          parameters: {
            type: "object",
            properties: {
              project: {
                type: "string",
                description: "The name of the project",
              },
              time: {
                type: "string",
                description: "The time of the notification",
              },
              status: {
                type: "string",
                description: "The new status of the project",
              },
              author: {
                type: "string",
                description: "The author of the commit",
              },
              message: {
                type: "string",
                description: "The message of the commit",
              },
            },
          },
        },
      ],
    }),
  });

  const data = (await res.json()) as OpenAIResponse;
  const argument = JSON.parse(
    data.choices[0].message.function_call.arguments
  ) as Notification;
  const message = constructNotificationText(argument);
  return message;
}

export interface OpenAIResponse {
  id: string;
  choices: Choice[];
}

export interface Choice {
  index: number;
  message: Message;
  finish_reason: string;
}

export interface Message {
  role: string;
  content: any;
  function_call: FunctionCall;
}

export interface FunctionCall {
  name: string;
  arguments: string;
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

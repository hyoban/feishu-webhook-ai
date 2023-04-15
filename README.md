# 如何在飞书收到 railway 的部署状态通知信息

## 一些相关信息

- Railway 支持 [Webhooks](https://docs.railway.app/diagnose/webhooks)
- 飞书有机器人可以接收信息，参考 [手把手教你用飞书 Webhook 打造一个消息推送 Bot](https://sspai.com/post/68578)
- Railway 的 Muxers 有 Discord 和 Slack，我们需要自己处理信息的转换
- [Deno Deploy](https://deno.com/deploy) 可以让我们白嫖部署

嗯，思路有了，只需要写个 Deno 的服务端程序，接收 Railway 的 webhook 信息，然后转发到飞书的机器人就好了，我这就开写。

## 拿来吧 Railway

点开 Railway 项目的设置项，你可以找到 webhook 的设置项，等我们的 Deno 程序部署好了就可以填到这里。下面有 webhook 会发送的信息，但是已经过时了，这里我给出我抓到的实际信息的 [TS 类型](https://github.com/hyoban/railway-to-feishu/blob/main/type.ts)。

然后，我们开始写 Deno 的服务端，Deno 的文档里有讲你该如何写一个 [HTTP Web Server](https://deno.com/manual@v1.32.1/examples/http_server)。大概的意思就是，每一个 http 链接都从一个异步迭代器中产生，我们可以从一个 HTTP 链接中拿到请求的具体信息和处理返回的函数。为了便于测试接口，我们对于非 POST 请求直接返回，对于 POST 请求获取到它的 body，然后发送到飞书。

这里从 webhook 拿了一些自认为比较重要的信息，比如触发部署的 commit 信息，当前的部署状态等。

```tsx
import { RailwayWebhook } from "./type.ts";

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
        new Response("Not POST", {
          status: 200,
        })
      );
    } else {
      const body = await request.json();
      console.log(body);
      const webhook = body as RailwayWebhook;
      const message = `Railway 项目 ${webhook.project.name} 的 ${webhook.environment.name} 环境 的 ${webhook.service.name} 服务由 ${webhook.deployment.creator.name} 因为 ${webhook.deployment.meta.commitMessage} 将状态变更为 ${webhook.status}。`;
      // 转发信息到飞书
      respondWith(
        new Response("Post", {
          status: 200,
        })
      );
    }
  }
}
```

## 发给飞书

将消息发给飞书就更简单了，Deno 可以直接写标准的 Web API，直接用 fetch 发请求就好，只是为了灵活性，我们从环境变量中读取机器人的 id。

```tsx
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
```

这里就只是将文本信息发送过去，事实上飞书的接口允许我们发送更多格式的信息，你可以查看第一节中提到的文章。

## 最后，来部署吧

当然，你不必再写一遍上面的代码，这并没有什么意思。如果你恰巧和我有一样的需求，你可以从我的 [GitHub 模板](https://github.com/hyoban/railway-to-feishu) 部署一份自己的服务端到 Deno。

只需要从你的仓库创建一个项目，选择 `index.ts` 文件，然后添加 `FEISHU_BOT_ID` 的环境变量即可。最后就是将部署成功，Deno 分配给你的域名填到此前说过的 Railway 的 Webhook 设置项即可。

![https://image.hyoban.cc/file/436c1b05e1dedc7f9f52b.png](https://image.hyoban.cc/file/436c1b05e1dedc7f9f52b.png)
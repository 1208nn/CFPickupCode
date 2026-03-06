# CFPickupCode

通过 CF AI 从文本中提取快递取件码。

## 部署

```bash
# 设置鉴权密钥
npx wrangler secret put API_KEY

npm run deploy
```

## 使用

```bash
curl -X POST https://your-worker.workers.dev \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"text": "您的快递已到站，取件码：A3B7，请尽快取件"}'
```

返回 `{"result": "A3B7"}` 或 `{"result": false}`

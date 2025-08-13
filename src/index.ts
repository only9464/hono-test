import { Hono } from 'hono'

// 定义 Hono 应用，并绑定 D1 数据库
const app = new Hono<{ Bindings: { DB: D1Database } }>()

// 根路由：访问时写入访问时间
app.get('/', async (c) => {
  const now = new Date().toISOString()
  await c.env.DB.prepare(
    'INSERT INTO visits (visited_at) VALUES (?)'
  ).bind(now).run()

  return c.text(`Hello Hono! Time recorded: ${now}`)
})

// 查看所有访问记录
app.get('/logs', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM visits ORDER BY id DESC')
    .all()
  return c.json(results)
})

export default app

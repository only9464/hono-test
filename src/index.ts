import { Hono } from 'hono'
import { showRoutes } from 'hono/dev'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'

// drizzle ORM
import { drizzle } from 'drizzle-orm/d1'
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'

// 定义 visits 表结构
const visits = sqliteTable('visits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  visitedAt: text('visited_at').notNull(),
})


const app = new Hono<{ Bindings: { DB: D1Database } }>()

// 根路由：访问时写入访问时间
app.get('/', async (c) => {
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()

  await db.insert(visits).values({ visitedAt: now }).run()

  return c.text(`Hello Hono! Time recorded: ${now}`)
})

// 查看所有访问记录
app.get('/logs', async (c) => {
  const db = drizzle(c.env.DB)
  const allLogs = await db
    .select()
    .from(visits)
    .orderBy(visits.id) // drizzle 会自动按 ASC 排，如果要 DESC 可以自己传函数
  return c.json(allLogs)
})

/* =====================
   无感认证相关代码
===================== */

// 登录接口
app.post('/login', async (c) => {
  let data: { username?: string }
  try {
    data = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const username = data.username
  if (!username) return c.json({ error: 'Username is required' }, 400)

  // 生成 JWT
  const exp = Math.floor(Date.now() / 1000) + 60 * 60
  const token = await sign({ user: username, exp }, 'my-secret', 'HS256')

  // 设置 httpOnly Cookie
  setCookie(c, 'auth', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 60 * 60,
  })

  return c.json({ message: 'Logged in successfully' })
})

// 注销接口
app.post('/logout', (c) => {
  deleteCookie(c, 'auth', { path: '/' })
  return c.json({ message: 'Logged out' })
})

// 无感认证中间件
app.use('/protected/*', async (c, next) => {
  const token = getCookie(c, 'auth')
  console.log(`Token: ${token}`)
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const payload = await verify(token, 'my-secret', 'HS256')
    c.set('jwtPayload', payload)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
})

// 受保护路由
app.get('/protected/profile', (c) => {
  const payload = c.get('jwtPayload')
  return c.json({ message: `Hello ${payload.user}, this is your profile.` })
})

showRoutes(app, { verbose: true })

export default app

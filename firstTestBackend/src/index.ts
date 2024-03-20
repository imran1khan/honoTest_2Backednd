import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { getPrisma } from '../usefullFun/prismaFun';

// Create the main Hono app
const app = new Hono<{
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  },
  Variables: {
    userId: string,
  }
}>();



app.use('/api/v1/blog/*', async (c, next) => {
  try {
    const jwt = c.req.header('Authorization');
    if (!jwt) {
      c.status(401);
      return c.json({ error: 'please pass Authorization' });
    }
    const token = jwt.split(' ')[1];
    const payload = await verify(token, c.env?.JWT_SECRET) as { id: string };
    if (!payload) {
      c.status(401);
      return c.json({ error: 'unauthorized' });
    }
    console.log(payload);
    c.set('userId', payload.id);
    await next();
  } catch (error) {
    c.status(403);
    return c.json({ error: "error while awt authentication" });
  }
});

app.post('/api/v1/blog', async (c) => {
  console.log(c.get('userId'));
  return c.json({ message: 'Authorization successfully' });
});

app.post('/api/v1/signup', async (c) => {
  interface bodyS {
    name: string,
    password: string,
    email: string
  }
  const prisma = getPrisma(c.env?.DATABASE_URL);
  const body = await c.req.json() as bodyS;
  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
        name: body.name
      }
    });
    const jwt = await sign({ id: user.id }, c.env?.JWT_SECRET);
    return c.json({ jwt, message: 'user sign-up successfully', });
  } catch (error) {
    c.status(403);
    c.json({ error: "error while signing up" });
  }
})

app.post('/api/v1/signin', async (c) => {
  const prisma = getPrisma(c.env?.DATABASE_URL);
  const body = await c.req.json() as { email: string };
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: body.email
      }
    });
    if (!user) {
      c.status(403);
      return c.json({
        message: 'user not found',
      });
    }
    const jwt = await sign({ id: user.id }, c.env?.JWT_SECRET)
    return c.json({ jwt, message: 'sign-in successfully', });
  } catch (error) {
    c.status(403);
    c.json({ message: 'error while sign-in', });
  }
})

app.get('/api/v1/blog/:id', (c) => {
  const id = c.req.param('id')
  console.log(id);
  return c.text('get blog route')
})

app.post('/api/v1/blog', (c) => {

  return c.text('signin route')
})

app.put('/api/v1/blog', (c) => {
  return c.text('signin route')
})

export default app;

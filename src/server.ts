import { guessRoutes } from "./routes/guess";
import { poolRoutes } from "./routes/pool";
import { authRoutes } from "./routes/auth";
import { gameRoutes } from "./routes/game";
import { userRoutes } from "./routes/user";
import cors from '@fastify/cors'
import jwt from "@fastify/jwt";
import Fastify from "fastify"


async function bootstrap() {
  const fastify = Fastify({
    logger: true
  })

  await fastify.register(cors, {
    origin: true,
  })

  await fastify.register(jwt, {
    secret: process.env.SECRET_TOKEN_JWT as string
  })
  
  await fastify.register(poolRoutes)
  await fastify.register(authRoutes)
  await fastify.register(gameRoutes)
  await fastify.register(guessRoutes)
  await fastify.register(userRoutes)

  await fastify.listen({
    port: parseInt(process.env.PORT || '3333'),
    host: '0.0.0.0',
  })
}

bootstrap()
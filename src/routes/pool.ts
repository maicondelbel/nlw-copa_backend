import { authenticate } from "../plugins/authenticate"
import ShortUniqueId from "short-unique-id"
import { FastifyInstance } from "fastify"
import { prisma } from "../lib/prisma"
import { z } from "zod"

export async function poolRoutes(fastify: FastifyInstance) {
  fastify.get('/pools/count', async () => {
    const count = await prisma.pool.count()
    return {
      count
    }
  })
  
  fastify.post('/pools', { onRequest: [authenticate] }, async (request, replay) => {
    const createPoolBody = z.object({
      title: z.string().min(5, { message: "Must be 5 or more characters long" }),
    })

    const { title } = createPoolBody.parse(request.body)
    const ownerId = request.user.sub
    const generateCode = new ShortUniqueId({ length: 5 })
    const code = String(generateCode()).toUpperCase()

    await prisma.pool.create({
      data: {
        title,
        code,
        ownerId,
        participants: {
          create: {
            userId: ownerId
          }
        }
      }
    })

    return replay.status(201).send({
      code
    })
  })

  fastify.post('/pools/join', { onRequest: [authenticate] }, async (request, replay) => {
    const joinPoolBody = z.object({
      code: z.string(),
    })

    const { code } = joinPoolBody.parse(request.body)

    const pool = await prisma.pool.findUnique({
      where: {
        code,
      },
      include: {
        participants: {
          where: {
            userId: request.user.sub
          }
        }
      }
    })

    if (!pool) {
      return replay.status(400).send({ message: "Pool not found!" })
    }

    if (pool.participants.length > 0) {
      return replay.status(400).send({ message: "You already joined this pool!" })
    }

    await prisma.participant.create({
      data: {
        poolId: pool.id,
        userId: request.user.sub
      }
    })

    return replay.status(201).send()

  }) 

  fastify.get('/pools', { onRequest: [authenticate] }, async (request, replay) => {
    const pools = await prisma.pool.findMany({
      where: {
        participants: {
          some: {
            userId: request.user.sub
          }
        }
      },
      include: {
        _count: {
          select: {
            participants: true,
          }
        },
        participants: {
          select: {
            id: true,
            user: {
              select: {
                avatarUrl: true,
              }
            }
          },
          take: 4,
        },
        owner: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return { pools }

  })



  fastify.get('/pools/:id', { onRequest: [authenticate] }, async (request, replay) => {
    const getPoolParams = z.object({
      id: z.string(),
    })

    const { id } = getPoolParams.parse(request.params)

    const pool = await prisma.pool.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            participants: true,
          }
        },
        participants: {
          select: {
            id: true,
            user: {
              select: {
                avatarUrl: true,
              }
            }
          },
          take: 4,
        },
        owner: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return { pool }

  })
}
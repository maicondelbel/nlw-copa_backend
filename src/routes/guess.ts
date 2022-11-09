import { authenticate } from "../plugins/authenticate";
import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export async function guessRoutes(fastify: FastifyInstance) {
  fastify.get('/guesses/count', async () => {
    const count = await prisma.guess.count()
    return {
      count
    }
  })

  fastify.post('/pools/:poolId/games/:gameId/guesses', { onRequest: [authenticate] }, async (request, replay) => {
    const createGuessParams = z.object({
      poolId: z.string(),
      gameId: z.string(),
    })

    const createGuessBody = z.object({
      firstTeamPoints: z.number(),
      secondTeamPoints: z.number(),
    })

    const { gameId, poolId } = createGuessParams.parse(request.params)
    const { firstTeamPoints, secondTeamPoints } = createGuessBody.parse(request.body)

    const participant = await prisma.participant.findUnique({
      where: {
        userId_poolId: {
          poolId,
          userId: request.user.sub,
        }
      }
    })

    if (!participant) {
      return replay.status(400).send({ message: "You are not allowed to create a guess into this pool!"})
    }

    const guess = await prisma.guess.findUnique({
      where: {
        participantId_gameId: {
          participantId: participant.id,
          gameId,
        }
      }
    })

    if(guess) {
      return replay.status(400).send({ message: "You are already made a guess into this pool!"})
    }

    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      }
    })

    if(!game) {
      return replay.status(400).send({ message: "Game not found!"})
    }

    if(game.date < new Date) {
      return replay.status(400).send({ message: "You cannot make a guess after the game!"})
    }

    await prisma.guess.create({
      data: {
        gameId,
        participantId: request.user.sub,
        firstTeamPoints,
        secondTeamPoints
      }
    })

  })
}
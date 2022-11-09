import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()

async function main() {

  const user = await prisma.user.create({
    data: {
      name: 'Fulano da Silva',
      email: 'teste@email.com.br',
      avatarUrl: 'https://github.com/maicondelbel.png',
      googleId: '1234567890'
    }
  })

  const pool = await prisma.pool.create({
    data: {
      title: 'Bolão do Seed',
      code: 'BOL123',
      ownerId: user.id,

      participants: {
        create: {
          userId: user.id
        }
      }
    }
  })

  await prisma.game.create({
    data: {
      date: '2022-11-20T14:00:00.952Z',
      firstTeamCountryCode: 'DE',
      secondTeamCountryCode: 'AR',
    }
  })

  await prisma.game.create({
    data: {
      date: '2022-11-20T14:00:00.952Z',
      firstTeamCountryCode: 'BR',
      secondTeamCountryCode: 'AR',

      guesses: {
        create: {
          firstTeamPoints: 2,
          secondTeamPoints: 1,
          
          participant: {
            connect: {
              userId_poolId: {
                userId: user.id,
                poolId: pool.id,
              }
            }
          }
        }
      }
    }
  })

}

main()
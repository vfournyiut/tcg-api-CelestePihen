import { Request, Response, Router } from 'express'
import { prisma } from '../database'

export const cardRouter = Router()

// GET /cards
// Accessible via GET /cards
cardRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const cards = await prisma.card.findMany({
      select: {
        id: true,
        name: true,
        hp: true,
        attack: true,
        type: true,
        pokedexNumber: true,
        imgUrl: true,
      },
      orderBy: {
        pokedexNumber: 'asc',
      },
    })

    return res.status(200).json({ cards })
  } catch (error) {
    console.error("Erreur lors de l'obtention des cartes:", error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
})

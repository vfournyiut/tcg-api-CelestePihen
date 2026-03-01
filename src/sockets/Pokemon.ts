import { Server as HTTPServer } from 'http'
import jwt from 'jsonwebtoken'
import { Server, Socket } from 'socket.io'

import { prisma } from '../database'
import { Card } from '../generated/prisma/client'

// Types simplifiés pour les événements avec rooms
interface ClientToServerEvents {
  getRooms: () => void
  createRoom: (data: { deckId: string }) => void
  joinRoom: (data: { roomId: string; deckId: string }) => void
  drawCards: (roomId: string) => void
  playCard: (roomId: string, cardIndex: string) => void
  attack: (roomId: string) => void
  endTurn: (roomId: string) => void
}

interface ServerToClientEvents {
  roomCreated: (room: Room) => void // TODO Confirmation envoyée au créateur avec les infos de la room
  roomsListUpdated: (rooms: Room[]) => void // TODO Broadcast à tous les clients avec la liste mise à jour (création partie) & Broadcast à tous les clients (room retirée de la liste)
  gameStarted: (cards: Card[], opponentCards: number) => void // TODO Envoyé aux 2 joueurs avec l'état initial
  error: (message: string) => void
}

interface UserData {
  userId: number
  email: string
}

interface Player {
  userId: number
  socketId: string
  userName: string
  deckId: number
}

interface Room {
  id: string
  host: Player
  opponent: Player | null
  state: 'waiting' | 'playing'
}

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>

export class PokemonServer {
  private io: TypedServer
  private rooms: Map<string, Room> // userId -> Room

  constructor(httpServer: HTTPServer) {
    this.io = new Server<ClientToServerEvents, ServerToClientEvents>(
      httpServer,
      {
        cors: { origin: '*' },
      },
    )

    this.rooms = new Map()

    this.setupAuthMiddleware()
    this.initializeSocket()
  }

  private setupAuthMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Token manquant'))
      }

      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET as string,
        ) as UserData
        socket.data = decoded
        next()
      } catch (_error) {
        next(new Error('Token invalide ou expiré'))
      }
    })
  }

  private initializeSocket() {
    this.io.on('connection', (socket) => {
      const userData = socket.data as UserData
      console.log('Nouvelle connexion:', socket.id, `(${userData.email})`)

      socket.on('createRoom', async (data: { deckId: string }) =>
        this.handleCreateRoom(socket, userData, parseInt(data.deckId)),
      )
      socket.on('getRooms', () => this.handleGetRooms(socket))
      socket.on('joinRoom', async (data: { roomId: string; deckId: string }) =>
        this.handleJoinRoom(
          socket,
          userData,
          data.roomId,
          parseInt(data.deckId),
        ),
      )
    })
  }

  private async handleCreateRoom(
    socket: TypedSocket,
    userData: UserData,
    deckId: number,
  ) {
    // deck existe dans la base de données
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: { deckCards: true },
    })

    if (!deck) {
      socket.emit('error', "Ce deck n'existe pas.")
      return
    }

    // vérifier si le deck appartient au joueur
    if (deck?.userId !== userData.userId) {
      socket.emit('error', 'Ce deck ne vous appartient pas.')
      return
    }

    // vérifier si le deck est valide (= 10 cartes)
    if (deck?.deckCards.length !== 10) {
      socket.emit('error', 'Le deck doit contenir exactement 10 cartes.')
      return
    }

    // socket crée / rejoint une room Socket.io
    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
    })

    const host: Player = {
      userId: userData.userId,
      userName: user!.username,
      deckId: deckId,
      socketId: socket.id,
    }

    const room: Room = {
      host,
      id: host.userId.toString(),
      opponent: null,
      state: 'waiting',
    }

    this.rooms.set(userData.userId.toString(), room)
    socket.join(userData.userId.toString())

    // envoie les informations de la room à l'host
    socket.emit('roomCreated', room)

    // broadcast à tous les clients avec la liste mise à jour
    this.broadcastRooms()
  }

  private broadcastRooms() {
    const rooms: Room[] = []
    this.rooms.forEach((room) => {
      if (room.state === 'waiting') {
        rooms.push(room)
      }
    })

    this.io.emit('roomsListUpdated', rooms)
  }

  private handleGetRooms(socket: TypedSocket) {
    const rooms: Room[] = []

    this.rooms.forEach((room) => {
      if (room.state === 'waiting') {
        rooms.push(room)
      }
    })

    socket.emit('roomsListUpdated', rooms)
  }

  private async handleJoinRoom(
    socket: TypedSocket,
    userData: UserData,
    roomId: string,
    deckId: number,
  ) {
    if (!this.rooms.has(roomId)) {
      socket.emit('error', "Cette room n'existe pas")
      return
    }

    const room = this.rooms.get(roomId)!

    if (room.opponent !== null) {
      socket.emit('error', 'Cette room est déjà complète')
      return
    }

    // deck existe dans la base de données
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        deckCards: {
          include: {
            card: true,
          },
        },
      },
    })

    if (!deck) {
      socket.emit('error', "Ce deck n'existe pas.")
      return
    }

    // vérifier si le deck appartient au joueur
    if (deck?.userId !== userData.userId) {
      socket.emit('error', 'Ce deck ne vous appartient pas.')
      return
    }

    // vérifier si le deck est valide (= 10 cartes)
    if (deck?.deckCards.length !== 10) {
      socket.emit('error', 'Le deck doit contenir exactement 10 cartes.')
      return
    }

    // socket crée / rejoint une room Socket.io
    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
    })

    const opponent: Player = {
      userId: userData.userId,
      userName: user!.username,
      deckId: deckId,
      socketId: socket.id,
    }

    socket.join(roomId)
    room.opponent = opponent
    room.state = 'playing'

    // Cards[] de l'host
    const hostDeck = await prisma.deck.findUnique({
      where: { id: room.host.deckId },
      include: {
        deckCards: {
          include: {
            card: true,
          },
        },
      },
    })

    const hostCards = hostDeck!.deckCards.map((deckCard) => deckCard.card)

    // Cards[] de l'opponent
    const opponentCards = deck.deckCards.map((deckCard) => deckCard.card)

    const hostSocket = this.io.sockets.sockets.get(room.host.socketId)
    if (hostSocket) {
      hostSocket.emit('gameStarted', hostCards, opponentCards.length)
    }

    socket.emit('gameStarted', opponentCards, hostCards.length)

    this.broadcastRooms()

    console.log(`${userData.email} a rejoint la room ${roomId}`)
  }
}

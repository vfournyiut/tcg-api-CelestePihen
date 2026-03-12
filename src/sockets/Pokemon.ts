import { Server as HTTPServer } from 'http'
import jwt from 'jsonwebtoken'
import { Server, Socket } from 'socket.io'

import { prisma } from '../database'
import { Card } from '../generated/prisma/client'
import { calculateDamage } from '../utils/rules.util'

// Types simplifiés pour les événements avec rooms
interface ClientToServerEvents {
  getRooms: () => void
  createRoom: (data: { deckId: string }) => void
  joinRoom: (data: { roomId: string; deckId: string }) => void
  drawCards: (data: { roomId: string }) => void
  playCard: (data: { roomId: string; cardIndex: number }) => void
  attack: (data: { roomId: string }) => void
  endTurn: (data: { roomId: string }) => void
}

interface ServerToClientEvents {
  roomCreated: (data: { room: Room }) => void
  roomsListUpdated: (data: { rooms: Room[] }) => void
  gameStarted: (data: { roomId: string; currentPlayerSocketId: string }) => void
  gameStateUpdated: (data: {
    hand: Card[]
    activeCard: Card | null
    score: number
    opponentActiveCard: Card | null
    opponentScore: number
    currentPlayerSocketId: string
  }) => void
  gameEnded: (data: { message: string }) => void
  error: (data: { message: string }) => void
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
  hand: Card[]
  deck: Card[]
  activeCard: Card | null
  score: number
}

interface Room {
  id: string
  host: Player
  opponent: Player | null
  currentPlayerSocketId: string
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

      socket.on('drawCards', (data: { roomId: string }) => {
        this.handleDrawCards(socket, data.roomId)
      })

      socket.on('playCard', (data: { roomId: string; cardIndex: number }) => {
        this.handlePlayCard(socket, data.roomId, data.cardIndex)
      })

      socket.on('attack', (data: { roomId: string }) => {
        this.handleAttack(socket, data.roomId)
      })

      socket.on('endTurn', (data: { roomId: string }) => {
        this.handleEndTurn(socket, data.roomId)
      })
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
      socket.emit('error', { message: "Ce deck n'existe pas." })
      return
    }

    // vérifier si le deck appartient au joueur
    if (deck?.userId !== userData.userId) {
      socket.emit('error', { message: 'Ce deck ne vous appartient pas.' })
      return
    }

    // vérifier si le deck est valide (= 10 cartes)
    if (deck?.deckCards.length !== 10) {
      socket.emit('error', {
        message: 'Le deck doit contenir exactement 10 cartes.',
      })
      return
    }

    // socket crée / rejoint une room Socket.io
    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
    })

    const host: Player = {
      userId: userData.userId,
      socketId: socket.id,
      userName: user!.username,
      deckId: deckId,
      hand: [],
      deck: [],
      activeCard: null,
      score: 0,
    }

    const room: Room = {
      host,
      id: host.userId.toString(),
      opponent: null,
      currentPlayerSocketId: host.socketId,
      state: 'waiting',
    }

    this.rooms.set(userData.userId.toString(), room)
    socket.join(userData.userId.toString())

    // envoie les informations de la room à l'host
    socket.emit('roomCreated', { room })

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

    this.io.emit('roomsListUpdated', { rooms })
  }

  private handleGetRooms(socket: TypedSocket) {
    const rooms: Room[] = []

    this.rooms.forEach((room) => {
      if (room.state === 'waiting') {
        rooms.push(room)
      }
    })

    socket.emit('roomsListUpdated', { rooms })
  }

  private async handleJoinRoom(
    socket: TypedSocket,
    userData: UserData,
    roomId: string,
    deckId: number,
  ) {
    if (!this.rooms.has(roomId)) {
      socket.emit('error', { message: "Cette room n'existe pas" })
      return
    }

    const room = this.rooms.get(roomId)!

    if (room.opponent !== null) {
      socket.emit('error', { message: 'Cette room est déjà complète' })
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
      socket.emit('error', { message: "Ce deck n'existe pas." })
      return
    }

    // vérifier si le deck appartient au joueur
    if (deck?.userId !== userData.userId) {
      socket.emit('error', { message: 'Ce deck ne vous appartient pas.' })
      return
    }

    // vérifier si le deck est valide (= 10 cartes)
    if (deck?.deckCards.length !== 10) {
      socket.emit('error', {
        message: 'Le deck doit contenir exactement 10 cartes.',
      })
      return
    }

    // socket crée / rejoint une room Socket.io
    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
    })

    const opponent: Player = {
      userId: userData.userId,
      socketId: socket.id,
      userName: user!.username,
      deckId: deckId,
      hand: [],
      deck: [],
      activeCard: null,
      score: 0,
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
      hostSocket.emit('gameStarted', {
        roomId: room.id,
        currentPlayerSocketId: room.currentPlayerSocketId,
      })
    }

    socket.emit('gameStarted', {
      roomId: room.id,
      currentPlayerSocketId: room.currentPlayerSocketId,
    })

    room.host.deck = hostCards
    opponent.deck = opponentCards

    this.broadcastRooms()
  }

  private handleDrawCards(socket: TypedSocket, roomId: string) {
    if (!this.rooms.has(roomId)) {
      socket.emit('error', { message: "Cette room n'existe pas" })
      return
    }

    const room = this.rooms.get(roomId)!

    if (room.currentPlayerSocketId !== socket.id) {
      socket.emit('error', {
        message: "Ce n'est pas à votre tour de tirer les cartes",
      })
      return
    }

    if (socket.id === room.host.socketId) {
      const randomCards: Card[] = []

      for (let i = 5 - room.host.hand.length; i > 0; i--) {
        const card = room.host.deck.shift()
        if (card) randomCards.push(card)
      }

      randomCards.forEach((card) => {
        room.host.hand.push(card)
      })
    } else {
      const randomCards: Card[] = []

      for (let i = 5 - room.opponent!.hand.length; i > 0; i--) {
        const card = room.opponent!.deck.shift()
        if (card) randomCards.push(card)
      }

      randomCards.forEach((card) => {
        room.opponent!.hand.push(card)
      })
    }

    this.broadcastGameState(room)
  }

  private broadcastGameState(room: Room) {
    const host = room.host
    const opponent = room.opponent!

    const hostGameState = {
      hand: host.hand,
      activeCard: host.activeCard,
      score: host.score,
      opponentActiveCard: opponent.activeCard,
      opponentScore: opponent.score,
      currentPlayerSocketId: room.currentPlayerSocketId,
    }

    const opponentGameState = {
      hand: opponent.hand,
      activeCard: opponent.activeCard,
      score: opponent.score,
      opponentActiveCard: host.activeCard,
      opponentScore: host.score,
      currentPlayerSocketId: room.currentPlayerSocketId,
    }

    const hostSocket = this.io.sockets.sockets.get(host.socketId)
    if (hostSocket) {
      hostSocket.emit('gameStateUpdated', hostGameState)
    }

    const opponentSocket = this.io.sockets.sockets.get(opponent.socketId)
    if (opponentSocket) {
      opponentSocket.emit('gameStateUpdated', opponentGameState)
    }
  }

  private handlePlayCard(
    socket: TypedSocket,
    roomId: string,
    cardIndex: number,
  ) {
    if (!this.rooms.has(roomId)) {
      socket.emit('error', { message: "Cette room n'existe pas" })
      return
    }

    const room = this.rooms.get(roomId)!

    if (room.currentPlayerSocketId !== socket.id) {
      socket.emit('error', {
        message: "Ce n'est pas à votre tour de jouer une carte",
      })
      return
    }

    if (socket.id === room.host.socketId) {
      if (room.host.activeCard) {
        socket.emit('error', { message: 'Vous avez déjà une carte active' })
        return
      }

      if (cardIndex < 0 || cardIndex >= room.host.hand.length) {
        socket.emit('error', { message: "Ceci n'est pas un index valide" })
        return
      }

      // retirer la carte de la main et la mettre comme carte active
      room.host.activeCard = room.host.hand.splice(cardIndex, 1)[0]
    } else {
      if (room.opponent!.activeCard) {
        socket.emit('error', { message: 'Vous avez déjà une carte active' })
        return
      }

      if (cardIndex < 0 || cardIndex >= room.opponent!.hand.length) {
        socket.emit('error', { message: "Ceci n'est pas un index valide" })
        return
      }

      room.opponent!.activeCard = room.opponent!.hand.splice(cardIndex, 1)[0]
    }

    this.broadcastGameState(room)
  }

  private handleAttack(socket: TypedSocket, roomId: string) {
    if (!this.rooms.has(roomId)) {
      socket.emit('error', { message: "Cette room n'existe pas" })
      return
    }

    const room = this.rooms.get(roomId)!

    if (room.currentPlayerSocketId !== socket.id) {
      socket.emit('error', { message: "Ce n'est pas à votre tour d'attaquer" })
      return
    }

    const host = room.host
    const opponent = room.opponent!

    if (socket.id === host.socketId) {
      // vérifier que les deux joueurs ont une carte active
      if (!host.activeCard) {
        socket.emit('error', { message: "Vous n'avez pas de carte active" })
        return
      }

      if (!opponent.activeCard) {
        socket.emit('error', {
          message: "Votre adversaire n'a pas de carte active",
        })
        return
      }

      // calculer les dégâts
      const damage = calculateDamage(
        host.activeCard.attack,
        host.activeCard.type,
        opponent.activeCard.type,
      )

      // appliquer les dégâts
      opponent.activeCard.hp -= damage
      room.currentPlayerSocketId =
        room.currentPlayerSocketId === host.socketId
          ? opponent.socketId
          : host.socketId

      // vérifier si le Pokémon de l'adversaire est KO
      if (opponent.activeCard.hp <= 0) {
        opponent.activeCard = null
        host.score += 1

        // vérifier si le joueur a gagné
        if (host.score === 3) {
          this.endGame(room)
        } else {
          this.broadcastGameState(room)
        }
      } else {
        this.broadcastGameState(room)
      }
    } else {
      if (!opponent.activeCard) {
        socket.emit('error', { message: "Vous n'avez pas de carte active" })
        return
      }

      if (!host.activeCard) {
        socket.emit('error', {
          message: "Votre adversaire n'a pas de carte active",
        })
        return
      }

      const damage = calculateDamage(
        opponent.activeCard.attack,
        opponent.activeCard.type,
        host.activeCard.type,
      )

      host.activeCard.hp -= damage
      room.currentPlayerSocketId =
        room.currentPlayerSocketId === host.socketId
          ? opponent.socketId
          : host.socketId

      if (host.activeCard.hp <= 0) {
        host.activeCard = null
        opponent.score += 1

        if (opponent.score === 3) {
          this.endGame(room)
        } else {
          this.broadcastGameState(room)
        }
      } else {
        this.broadcastGameState(room)
      }
    }
  }

  private endGame(room: Room) {
    const host = room.host
    const opponent = room.opponent!

    // envoie de l'événement avec le vainqueur
    if (host.score === 3) {
      this.io
        .to(room.id)
        .emit('gameEnded', { message: 'Le vainqueur est ' + host.userName })
    } else {
      this.io
        .to(room.id)
        .emit('gameEnded', { message: 'Le vainqueur est ' + opponent.userName })
    }

    // enlever les joueurs de la Room et la supprimer la Room
    const hostSocket = this.io.sockets.sockets.get(host.socketId)
    if (hostSocket) {
      hostSocket.leave(room.id)
    }

    const opponentSocket = this.io.sockets.sockets.get(opponent.socketId)
    if (opponentSocket) {
      opponentSocket.leave(room.id)
    }

    this.rooms.delete(room.host.userId.toString())
  }

  private handleEndTurn(socket: TypedSocket, roomId: string) {
    if (!this.rooms.has(roomId)) {
      socket.emit('error', { message: "Cette room n'existe pas" })
      return
    }

    const room = this.rooms.get(roomId)!

    if (room.currentPlayerSocketId !== socket.id) {
      socket.emit('error', { message: "Ce n'est pas à votre tour" })
      return
    }

    const host = room.host
    const opponent = room.opponent!

    if (room.currentPlayerSocketId === host.socketId) {
      room.currentPlayerSocketId = opponent.socketId
    } else {
      room.currentPlayerSocketId = host.socketId
    }

    // envoyer déjà un message indiquant le tour du joueur
    this.broadcastGameState(room)
  }
}

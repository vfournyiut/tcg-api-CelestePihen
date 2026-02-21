import {Server as HTTPServer} from 'http'
import jwt from 'jsonwebtoken'
import {Server, Socket} from 'socket.io'

import {prisma} from "../database";

// Types simplifiés pour les événements avec rooms
interface ClientToServerEvents {
    'getRooms': () => void
    'createRoom': (data: {deckId: number}) => void
    'joinRoom': (data: {roomId: number, deckId: number}) => void
    'drawCards': (roomId: number) => void
    'playCard': (roomId: number, cardIndex: number) => void
    'attack': (roomId: number) => void
    'endTurn': (roomId: number) => void
}

interface ServerToClientEvents {
    'roomCreated': (room: Room) => void // TODO Confirmation envoyée au créateur avec les infos de la room
    'roomsListUpdated': (rooms: Set<Room>) => void // TODO Broadcast à tous les clients avec la liste mise à jour (création partie) & Broadcast à tous les clients (room retirée de la liste) 
    'gameStarted': () => void // TODO Envoyé aux 2 joueurs avec l'état initial
    'error': (message: string) => void
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
        this.io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
            cors: {origin: '*'},
        })

        this.rooms = new Map();
        
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
                const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserData
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

            socket.on('createRoom', async (data: {deckId: number}) => this.handleCreateRoom(socket, userData, data.deckId))
        })
    }

    private async handleCreateRoom(socket: TypedSocket, userData: UserData, deckId: number) {
        console.log(deckId)

        // deck existe dans la base de données
        const deck = await prisma.deck.findUnique({
            where: {id: deckId},
            include: {deckCards: true}
        })

        if (!deck) {
            socket.emit('error', 'Ce deck n\'existe pas.')
            return;
        }

        // vérifier si le deck appartient au joueur
        if (deck?.userId !== userData.userId) {
            socket.emit('error', 'Ce deck ne vous appartient pas.')
            return;
        }

        // vérifier si le deck est valide (!= 10 cartes)
        if (deck?.deckCards.length !== 10) {
            socket.emit('error', 'Le deck doit contenir exactement 10 cartes.')
            return;
        }

        // socket crée / rejoint une room Socket.io
        const user = await prisma.user.findUnique({
            where: {id: userData.userId},
        })

        const host: Player = {
            userId: userData.userId,
            userName: user!.username,
            deckId: deckId,
            socketId: socket.id
        }
        
        const room: Room = {
            host,
            id: host.userId.toString(),
            opponent: null,
            state: 'waiting'
        }

        this.rooms.set(userData.userId.toString(), room)
        socket.join(userData.userId.toString())
        
        // envoie les informations de la room à l'host
        socket.emit('roomCreated', room)

        // broadcast à tous les clients avec la liste mise à jour
        const rooms = new Set<Room>()
        this.rooms.forEach((room) => {
            if (room.state === 'waiting') {
                rooms.add(room)
            }
        });

        this.io.emit('roomsListUpdated', rooms)
    }

}
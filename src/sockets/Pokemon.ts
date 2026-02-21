import {Server as HTTPServer} from 'http'
import jwt from 'jsonwebtoken'
import {Server} from 'socket.io'

interface UserData {
    userId: number
    email: string
}

export class PokemonServer {
    private io: Server

    constructor(httpServer: HTTPServer) {
        this.io = new Server(httpServer, {
            cors: {origin: '*'},
        })
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
        })
    }
}
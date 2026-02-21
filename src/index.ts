/**
 * @file Point d'entrée de l'application
 * @description Configure et démarre le serveur Express avec toutes les routes et middlewares
 */

import * as http from "node:http";

import cors from "cors";
import express from "express";
import swaggerUi from 'swagger-ui-express'

import {swaggerDocument} from './docs'
import {env} from "./env";
import {authRouter} from "./route/auth.route";
import {cardRouter} from "./route/card.route";
import {deckRouter} from "./route/deck.route";
import {PokemonServer} from "./socket/Pokemon";

/**
 * Instance de l'application Express
 * @const {express.Application}
 */
export const app = express();
const server = http.createServer(app);

new PokemonServer(server);

// Middlewares
app.use(
    cors({
        origin: true,  // Autorise toutes les origines
        credentials: true,
    }),
);

app.use(express.json());

// Serve static files (Socket.io test client)
app.use(express.static('public'));

// Documentation Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "API Documentation"
}))

// Route Express classique
app.get('/', (_req, res) => {
    res.send('Serveur Socket.IO actif')
})

/**
 * Health check endpoint
 * @route GET /api/health
 * @returns {Object} 200 - Statut du serveur
 * @returns {string} 200.status - État du serveur (ok)
 * @returns {string} 200.message - Message de confirmation
 */
app.get("/api/health", (_req, res) => {
    res.json({status: "ok", message: "TCG Backend Server is running"});
});

app.use('/api/auth', authRouter);
app.use('/api/cards', cardRouter);
app.use('/api/decks', deckRouter);

// Start server only if this file is run directly (not imported for tests)
if (require.main === module) {
    // Start server
    try {
      server.listen(env.PORT, () => {
        console.log(`\n🚀 Server is running on http://localhost:${env.PORT}`)
        console.log(
          `🧪 Socket.io Test Client available at http://localhost:${env.PORT}`,
        )
      })
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

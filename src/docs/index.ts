/**
 * @file Agrégateur de documentation Swagger
 * @description Charge et fusionne tous les fichiers de documentation OpenAPI
 */

import path from 'path'
import {fileURLToPath} from 'url'
import YAML from 'yamljs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Charger la configuration principale
const swaggerConfig = YAML.load(path.join(__dirname, 'swagger.config.yml'))

// Charger les documentations des modules
const authDoc = YAML.load(path.join(__dirname, 'auth.doc.yml'))
const cardDoc = YAML.load(path.join(__dirname, 'card.doc.yml'))
const deckDoc = YAML.load(path.join(__dirname, 'deck.doc.yml'))

/**
 * Document Swagger complet fusionné
 * @description Combine la configuration principale avec tous les endpoints des modules
 */
export const swaggerDocument = {
    ...swaggerConfig,
    paths: {
        ...authDoc.paths,
        ...cardDoc.paths,
        ...deckDoc.paths
    }
}

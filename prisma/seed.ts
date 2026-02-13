import bcrypt from "bcryptjs";
import {readFileSync} from "fs";
import {join} from "path";

import {prisma} from "../src/database";
import {PokemonType} from "../src/generated/prisma/enums";
import {CardModel} from "../src/generated/prisma/models/Card";

/**
 * Retourne 10 cartes aléatoires parmi les cartes disponibles
 * @param cardsAvailable Liste des cartes disponibles
 * @return Liste de 10 cartes aléatoires parmi les cartes disponibles
 */
function randomCard(cardsAvailable: CardModel[]): CardModel[] {
    if (cardsAvailable.length < 10) {
        throw new Error("At least 10 cards are required.");
    }

    const result: CardModel[] = [];
    const availableCards = [...cardsAvailable];

    for (let i = 0; i < 10; i++) {
        // Math.random retourne un nombre entre 0 et 1
        // On le multiplie par la longueur du tableau pour obtenir un index valide
        // On utilise Math.floor pour arrondir à l'entier inférieur
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        result.push(availableCards[randomIndex]);
        availableCards.splice(randomIndex, 1);
    }

    return result;
}

async function main() {
    console.log("🌱 Starting database seed...");

    await prisma.deckCard.deleteMany();
    await prisma.deck.deleteMany();
    await prisma.card.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash("password123", 10);

    await prisma.user.createMany({
        data: [
            {
                username: "red",
                email: "red@example.com",
                password: hashedPassword,
            },
            {
                username: "blue",
                email: "blue@example.com",
                password: hashedPassword,
            },
        ],
    });

    const redUser = await prisma.user.findUnique({where: {email: "red@example.com"}});
    const blueUser = await prisma.user.findUnique({where: {email: "blue@example.com"}});

    if (!redUser || !blueUser) {
        throw new Error("Failed to create users");
    }

    console.log("✅ Created users:", redUser.username, blueUser.username);

    const pokemonDataPath = join(__dirname, "data", "pokemon.json");
    const pokemonJson = readFileSync(pokemonDataPath, "utf-8");
    const pokemonData: CardModel[] = JSON.parse(pokemonJson);

    const createdCards = await Promise.all(
        pokemonData.map((pokemon) =>
            prisma.card.create({
                data: {
                    name: pokemon.name,
                    hp: pokemon.hp,
                    attack: pokemon.attack,
                    type: PokemonType[pokemon.type as keyof typeof PokemonType],
                    pokedexNumber: pokemon.pokedexNumber,
                    imgUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.pokedexNumber}.png`,
                },
            })
        )
    );

    console.log(`✅ Created ${pokemonData.length} Pokemon cards`);

    // Créer un deck de démarrage pour l'utilisateur 'red'
    const redStarterCards = randomCard(createdCards);
    const redDeck = await prisma.deck.create({
        data: {
            name: "Starter Deck",
            userId: redUser.id,

        },
    });

    await Promise.all(
        redStarterCards.map((card) =>
            prisma.deckCard.create({
                data: {
                    deckId: redDeck.id,
                    cardId: card.id,
                },
            })
        )
    );

    console.log(`✅ Created Starter Deck for ${redUser.username} with ${redStarterCards.length} cards`);

    // Créer un deck de démarrage pour l'utilisateur blue
    const blueStarterCards = randomCard(createdCards);
    const blueDeck = await prisma.deck.create({
        data: {
            name: "Starter Deck",
            userId: blueUser.id,
        },
    });

    await Promise.all(
        blueStarterCards.map((card) =>
            prisma.deckCard.create({
                data: {
                    deckId: blueDeck.id,
                    cardId: card.id,
                },
            })
        )
    );

    console.log(`✅ Created Starter Deck for ${blueUser.username} with ${blueStarterCards.length} cards`);

    console.log("\n🎉 Database seeding completed!");
}

main()
    .catch((e) => {
        console.error("❌ Error seeding database:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

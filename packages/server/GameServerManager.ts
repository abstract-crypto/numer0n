import { GameServer } from "./GameServer";

export class GameServerManager {
	private static games: Map<string, GameServer> = new Map();

	/**
	 * Creates a new game server on the next available port.
	 * Throws an error if the gameId already exists.
	 */
	public static createGame(gameId: string, contractAddress: string): void {
		if (this.games.has(gameId)) {
			throw new Error(`Game with ID ${gameId} already exists.`);
		}

		const server = new GameServer(gameId, contractAddress);
		this.games.set(gameId, server);

		console.log(`GameServerManager: Created game with ID ${gameId}`);
	}

	/**
	 * Retrieve an existing game server by gameId.
	 */
	public static getGameServer(gameId: string): GameServer | undefined {
		return this.games.get(gameId);
	}
}

import { GameServer } from "./GameServer";

export class GameServerManager {
	private static games: Map<string, GameServer> = new Map();
	private static basePort = 9000; // we start from 9000 and increment

	/**
	 * Creates a new game server on the next available port.
	 * Throws an error if the gameId already exists.
	 */
	public static createGame(
		gameId: string,
		contractAddress: string
	): { port: number } {
		if (this.games.has(gameId)) {
			throw new Error(`Game with ID ${gameId} already exists.`);
		}

		const port = this.getNextAvailablePort();
		const server = new GameServer(gameId, contractAddress, port);
		this.games.set(gameId, server);

		return { port };
	}

	/**
	 * Retrieve an existing game server by gameId.
	 */
	public static getGameServer(gameId: string): GameServer | undefined {
		return this.games.get(gameId);
	}

	/**
	 * Example: We just increment basePort each time for a naive approach.
	 * In real usage, you’d manage port conflicts, etc.
	 */
	private static getNextAvailablePort(): number {
		const port = this.basePort;
		this.basePort++;
		return port;
	}
}

import { getItem, removeItem, setItem } from "src/scripts/storage";

export const GAME_STATUS = {
	NULL: 0,
	PLAYERS_SET: 1,
	STARTED: 2,
	FINISHED: 3,
};

export const GUESS_STATUS = {
	NULL: 0,
	GUESSED: 1,
	EVALUATED: 2,
};

export type GuessStatus =
	| typeof GUESS_STATUS.NULL
	| typeof GUESS_STATUS.GUESSED
	| typeof GUESS_STATUS.EVALUATED;
export type GameStatus =
	| typeof GAME_STATUS.NULL
	| typeof GAME_STATUS.PLAYERS_SET
	| typeof GAME_STATUS.STARTED
	| typeof GAME_STATUS.FINISHED;

export type Guess = {
	guess: number;
	eat: number;
	bite: number;
};

export type Player = {
	id: number;
	address: string;
	guesses: Guess[];
	secretNumber?: number;
};

export type GameData = {
	contractAddress: string;
	self: Player;
	opponent: Player;
	gameCode: string;
	gamePort: number;
};

const emptyPlayer: Player = {
	id: 0,
	address: "",
	secretNumber: undefined,
	guesses: [],
};

const emptyGameData: GameData = {
	contractAddress: "",
	self: emptyPlayer,
	opponent: emptyPlayer,
	gameCode: "",
	gamePort: 0,
};

export class Game {
	private static STORAGE_KEY = "numer0n_game_data";

	private gameData: GameData;

	constructor() {
		const storedData = getItem(Game.STORAGE_KEY);
		if (storedData) {
			this.gameData = storedData;
		} else {
			this.gameData = emptyGameData;
		}
	}

	public loadGameData() {
		const storedData = getItem(Game.STORAGE_KEY);
		if (storedData) {
			this.gameData = storedData;
		}
	}

	private saveToLocalStorage() {
		setItem(Game.STORAGE_KEY, this.gameData);
	}

	// Getters
	getContractAddress(): string {
		return this.gameData.contractAddress;
	}

	getSelf(): Player {
		return this.gameData.self;
	}

	getOpponent(): Player {
		return this.gameData.opponent;
	}

	getSecretNumber(): number | undefined {
		return this.gameData.self.secretNumber;
	}

	getGameCode(): string {
		return this.gameData.gameCode;
	}

	getGameData(): GameData {
		return this.gameData;
	}

	getGuesses(isSelf: boolean): Guess[] {
		return isSelf ? this.gameData.self.guesses : this.gameData.opponent.guesses;
	}

	getGamePort(): number {
		return this.gameData.gamePort;
	}

	// Setters
	setContractAddress(address: string) {
		this.gameData.contractAddress = address;
		this.saveToLocalStorage();
	}

	setSelf(player: Player) {
		this.gameData.self = player;
		this.saveToLocalStorage();
	}

	setOpponent(player: Player) {
		this.gameData.opponent = player;
		this.saveToLocalStorage();
	}

	setSecretNumber(num: number) {
		this.gameData.self.secretNumber = num;
		this.saveToLocalStorage();
	}

	setGameCode(id: string) {
		this.gameData.gameCode = id;
		this.saveToLocalStorage();
	}

	setGame(gameData: GameData) {
		this.gameData = gameData;
		this.saveToLocalStorage();
	}

	setGuesses(isSelf: boolean, guesses: Guess[]) {
		if (isSelf) {
			this.gameData.self.guesses = guesses;
		} else {
			this.gameData.opponent.guesses = guesses;
		}
		this.saveToLocalStorage();
	}

	setGamePort(port: number) {
		this.gameData.gamePort = port;
		this.saveToLocalStorage();
	}

	async logout() {
		this.gameData = emptyGameData;
		removeItem(Game.STORAGE_KEY);
	}
}

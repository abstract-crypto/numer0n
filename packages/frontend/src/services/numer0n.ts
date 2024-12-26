import { AztecAddress, AccountWallet, Wallet } from "@aztec/aztec.js";

import { Numer0nContract } from "../artifacts/Numer0n.js";
import { Guess } from "src/services/game.js";

export class Numer0nContractService {
	contractAddress: AztecAddress;
	self: AccountWallet;
	opponent: AccountWallet | undefined;

	constructor(
		contractAddress: string,
		self: AccountWallet,
		opponent?: AccountWallet
	) {
		this.contractAddress = AztecAddress.fromString(contractAddress);
		this.self = self;
		this.opponent = opponent;
	}

	async getNumer0nContract(player?: AccountWallet): Promise<Numer0nContract> {
		try {
			const numer0n = await Numer0nContract.at(
				this.contractAddress,
				player || this.self
			);
			return numer0n;
		} catch (e) {
			console.log("Get numer0n contract error: ", e);
			throw e;
		}
	}

	async createGame(gameCode: string): Promise<AztecAddress | null> {
		try {
			const receipt = await Numer0nContract.deploy(
				this.self,
				this.self.getAddress(),
				BigInt(gameCode)
			)
				.send()
				.wait();

			return receipt.contract.address;
		} catch (e) {
			console.log("Create game error: ", e);
			return null;
		}
	}

	/**
	 * Joins an existing game.
	 * @param gameCode The code of the game to join.
	 */
	async joinGame(gameCode: bigint): Promise<void> {
		const numer0nContract = await this.getNumer0nContract();
		try {
			await numer0nContract.methods
				.join_game(this.self.getAddress(), gameCode)
				.send()
				.wait();
		} catch (e) {
			console.log("Join game error: ", e);
		}
	}

	/**
	 * Adds a number to the game.
	 * @param secretNum The secret number to add.
	 */
	async addNumber(secretNum: bigint): Promise<void> {
		const numer0nContract = await this.getNumer0nContract();
		try {
			await numer0nContract.methods
				.add_num(this.self.getAddress(), secretNum)
				.send()
				.wait();
		} catch (e) {
			console.log("Add number error: ", e);
		}
	}

	/**
	 * Makes a guess in the game.
	 * @param guessNum The number to guess.
	 */
	async guessNumber(guessNum: number): Promise<void> {
		const numer0nContract = await this.getNumer0nContract();
		try {
			await numer0nContract.methods
				.guess_num(this.self.getAddress(), guessNum)
				.send()
				.wait();
		} catch (e) {
			console.log("Guess number error: ", e);
		}
	}

	/**
	 * Evaluates a guess made by a self.
	 * @param guesser The self who made the guess.
	 * @param guessNum The guessed number.
	 */
	async evaluateGuess(guesser: AccountWallet, guessNum: number): Promise<void> {
		if (!this.opponent) {
			console.log("Opponent not found");
			return;
		}
		const numer0nContract = await this.getNumer0nContract(this.opponent);
		try {
			await numer0nContract.methods
				.evaluate_guess(
					this.opponent.getAddress(),
					guesser.getAddress(),
					guessNum
				)
				.send()
				.wait();
		} catch (e) {
			console.log("Evaluate guess error: ", e);
		}
	}

	/**
	 * Retrieves whether the self is the first mover.
	 * @param wallet The wallet of the self.
	 * @returns A boolean indicating if the self is first.
	 */
	async getIsFirst(): Promise<boolean> {
		const numer0nContract = await this.getNumer0nContract();
		return await numer0nContract.methods.get_is_first().simulate();
	}

	/**
	 * Retrieves the current round of the game.
	 * @param wallet The wallet of the self.
	 * @returns The current round as a bigint.
	 */
	async getRound(): Promise<bigint> {
		const numer0nContract = await this.getNumer0nContract();
		return await numer0nContract.methods.get_round().simulate();
	}

	/**
	 * Retrieves a specific guess made by a self.
	 * @param player The address of the self who made the guess.
	 * @param round The round number of the guess.
	 * @returns A Guess object containing guess details.
	 */
	async getGuess(player: AztecAddress, round: number): Promise<Guess> {
		const numer0nContract = await this.getNumer0nContract();
		const res = await numer0nContract.methods
			.get_guess(player, BigInt(round))
			.simulate();
		return {
			guess: Number(res.guess_num),
			eat: Number(res.eat),
			bite: Number(res.bite),
		};
	}

	/**
	 * Retrieves all guesses made by a self.
	 * @param self The address of the self.
	 * @returns An array of Guess objects.
	 */
	async getGuesses(player: AztecAddress): Promise<Guess[]> {
		const numer0nContract = await this.getNumer0nContract();
		console.log(
			"getGuesses: ",
			player.toString(),
			this.contractAddress.toString()
		);

		const res = await numer0nContract.methods.get_guesses(player).simulate();
		console.log("res: ", res);
		return res.map((g: any) => ({
			guess: Number(g.guess_num),
			eat: Number(g.eat),
			bite: Number(g.bite),
		}));
	}

	/**
	 * Retrieves self information.
	 * @param playerAddress The address of the self.
	 * @returns An array containing self ID and participation status.
	 */
	async getPlayer(playerAddress: string): Promise<bigint[]> {
		const numer0nContract = await this.getNumer0nContract();
		const res = await numer0nContract.methods
			.get_player(AztecAddress.fromString(playerAddress))
			.simulate();
		return [res.player_id, res.is_player];
	}

	/**
	 * Checks the result of a guess.
	 * @param callNum The number called.
	 * @param secretNum The secret number.
	 * @returns An array containing the eat and bite counts.
	 */
	async checkResult(callNum: bigint, secretNum: bigint): Promise<bigint[]> {
		const numer0nContract = await this.getNumer0nContract();
		const res = await numer0nContract.methods
			.check_result(callNum, secretNum)
			.simulate();
		return [res.eat, res.bite];
	}

	/**
	 * Validates a number.
	 * @param num The number to validate.
	 * @returns A boolean indicating if the number is valid.
	 */
	async isValidNum(num: bigint): Promise<boolean> {
		const numer0nContract = await this.getNumer0nContract();
		return await numer0nContract.methods.is_valid_nums(num).simulate();
	}

	/**
	 * Checks if both players have been added to the game.
	 * @param wallet The wallet of the self.
	 * @returns A boolean indicating if both players are added.
	 */
	async getIfPlayersAdded(): Promise<boolean> {
		const game = await this.getGame();
		return game.players[0] !== 0n && game.players[1] !== 0n;
	}

	/**
	 * Retrieves the address of a self by their ID.
	 * @param playerId The ID of the self.
	 * @returns The address of the self as a string.
	 */
	async getPlayerAddr(playerId: number): Promise<string> {
		const game = await this.getGame();
		return fromBigIntToHexStrAddress(game.players[playerId - 1]);
	}

	/**
	 * Checks if the game has finished.
	 * @param wallet The wallet of the self.
	 * @returns A boolean indicating if the game is finished.
	 */
	async getIsFinished(): Promise<boolean> {
		const game = await this.getGame();
		return game.finished;
	}

	/**
	 * Retrieves the winner of the game.
	 * @param wallet The wallet of the self.
	 * @returns The winner's ID as a bigint.
	 */
	async getWinner(): Promise<number> {
		const game = await this.getGame();
		console.log("game: ", game);
		return Number(game.winner_id);
	}

	/**
	 * Retrieves the current status of the game.
	 * @returns The game status as a bigint.
	 */
	async getGameStatus(): Promise<bigint> {
		const game = await this.getGame();
		return game.status;
	}

	/**
	 * Retrieves the game details.
	 * @param wallet The wallet of the self.
	 * @returns The game object.
	 */
	async getGame() {
		const numer0nContract = await this.getNumer0nContract();
		return await numer0nContract.methods.get_game().simulate();
	}

	async getSecretNum(player: string): Promise<number> {
		const numer0nContract = await this.getNumer0nContract();
		const res = await numer0nContract.methods
			.get_secret_num(AztecAddress.fromString(player))
			.simulate();
		return Number(res);
	}
}

const fromBigIntToHexStrAddress = (addr: bigint) => {
	// return "0x" + BigInt(addr).toString(16);
	return AztecAddress.fromBigInt(addr).toString();
};

import {
	PXE,
	createPXEClient,
	AztecAddress,
	AccountWalletWithSecretKey,
	waitForPXE,
	TxStatus,
} from "@aztec/aztec.js";
import { beforeAll, it, describe, expect } from "vitest";
import { getDeployedTestAccountsWallets } from "@aztec/accounts/testing";

import { Numer0nContract } from "./artifacts/Numer0n.js";
import { SANDBOX_URL } from "./utils/constants.js";

let pxe: PXE;
let numer0n: Numer0nContract;

let player1: AccountWalletWithSecretKey;
let player2: AccountWalletWithSecretKey;
let deployer: AccountWalletWithSecretKey;

let player1Addr: AztecAddress;
let player2Addr: AztecAddress;

const GAME_STATUS_NULL = 0n;
const GAME_STATUS_PLAYERS_SET = 1n;
const GAME_STATUS_STARTED = 2n;
const GAME_STATUS_FINISHED = 3n;

const GUESS_STATUS_NULL = 0n;
const GUESS_STATUS_GUESSED = 1n;
const GUESS_STATUS_EVALUATED = 2n;

// default secret nums
// player 1 = 125
// player 2 = 125

const TIMEOUT = 120_000;

// Setup: Set the sandbox
beforeAll(async () => {
	pxe = createPXEClient(SANDBOX_URL);
	await waitForPXE(pxe);

	const accounts = await getDeployedTestAccountsWallets(pxe);
	player1 = accounts[0];
	player2 = accounts[1];
	deployer = accounts[2];

	player1Addr = player1.getAddress();
	player2Addr = player2.getAddress();

	console.log(
		"accoutns: ",
		accounts.map((acc) => acc.getAddress().toString())
	);
});

describe("E2E Numer0n", () => {
	// Setup: Deploy the oracle
	beforeAll(async () => {
		const game_id = 123n;

		console.log("deploying Numer0n contract");
		const receipt = await Numer0nContract.deploy(
			deployer,
			player1.getAddress(),
			game_id
		)
			.send()
			.wait();

		numer0n = receipt.contract;
		console.log("numer0n contract: ", numer0n.address.toString());
	});

	it("should successfully setup", async () => {
		const game_id = 123n;

		const game_before = await numer0n.methods.get_game().simulate();
		expect(game_before.status).toBe(GAME_STATUS_NULL);

		await numer0n
			.withWallet(player2)
			.methods.join_game(player2.getAddress(), game_id)
			.send()
			.wait();

		const game_after = await numer0n.methods.get_game().simulate();
		expect(game_after.status).toBe(GAME_STATUS_PLAYERS_SET);
	});

	// TODO: try to add num before game starts
	// "[_add_num] players haven't been setup"

	it("should fail due to call from invalid caller/player", async () => {
		const secret_num = 125n;

		await expect(
			numer0n
				.withWallet(deployer)
				.methods.add_num(player1Addr, secret_num)
				.send()
				.wait()
		).rejects.toThrowError("Assertion failed: [add_num] sender must be player");

		await expect(
			numer0n.methods.add_num(deployer.getAddress(), secret_num).send().wait()
		).rejects.toThrowError("Assertion failed: [_assert_is_player] not player");
	});

	it("should add nums correctly:player 1", async () => {
		const secret_num = 125n;

		const tx = await numer0n
			.withWallet(player1)
			.methods.add_num(player1Addr, secret_num)
			.send()
			.wait();

		console.log("tx: ", tx.txHash.toString());
		expect(tx.status).toBe(TxStatus.SUCCESS);

		const _secert_num = await numer0n
			.withWallet(player1)
			.methods.get_secret_num(player1Addr)
			.simulate();

		console.log("_secert_num: ", _secert_num);
		expect(_secert_num).toEqual(secret_num);
	});

	it("should fail to add num for the second time: player 1 ", async () => {
		const secret_num1 = 327n;

		//  Nullifier collision encountered when inserting revertible nullifiers from private
		await expect(
			numer0n
				.withWallet(player1)
				.methods.add_num(player1Addr, secret_num1)
				.send()
				.wait()
		).rejects.toThrow();
	});

	it("should fail as game hasn't been started yet", async () => {
		// player 2 should create authwitness for player 1 to send tx
		const guess_num = 293n;

		await expect(
			numer0n
				.withWallet(player1)
				.methods.guess_num(player1.getAddress(), guess_num)
				.send()
				.wait()
		).rejects.toThrowError(
			"Assertion failed: [guess_num] game hasn't been started yet"
		);
	});

	it("should add nums correctly:player 2", async () => {
		const secret_num = 125n;

		const game_before = await numer0n.methods.get_game().simulate();
		expect(game_before.status).toBe(GAME_STATUS_PLAYERS_SET);

		const tx = await numer0n
			.withWallet(player2)
			.methods.add_num(player2Addr, secret_num)
			.send()
			.wait();

		console.log("tx: ", tx.txHash.toString());
		expect(tx.status).toBe(TxStatus.SUCCESS);

		const _secert_num = await numer0n
			.withWallet(player2)
			.methods.get_secret_num(player2Addr)
			.simulate();

		console.log("_secert_num: ", _secert_num);
		expect(_secert_num).toEqual(secret_num);

		const game_after = await numer0n.methods.get_game().simulate();
		expect(game_after.status).toBe(GAME_STATUS_STARTED);
	});

	it("should fail to add different num for the second time: player 2", async () => {
		const secret_num2 = 954n;

		//  Nullifier collision encountered when inserting revertible nullifiers from private
		await expect(
			numer0n
				.withWallet(player2)
				.methods.add_num(player2Addr, secret_num2)
				.send()
				.wait()
		).rejects.toThrow();
	});

	it("should fail due to invalid sender", async () => {
		const guess_num = 293n;

		await expect(
			numer0n
				.withWallet(deployer)
				.methods.guess_num(player1.getAddress(), guess_num)
				.send()
				.wait()
		).rejects.toThrowError(
			"Assertion failed: [guess_num] sender must be player"
		);
	});

	it("shouldn fail as invalid turn for p2", async () => {
		const guess_num = 293n;

		await expect(
			numer0n
				.withWallet(player2)
				.methods.guess_num(player2.getAddress(), guess_num)
				.send()
				.wait()
		).rejects.toThrowError(
			"Assertion failed: [guess_num] invalid turn for player 2"
		);
	});

	it("should p1 successfully call guess_num()", async () => {
		const guess_num = 125n;

		const guess_before = await numer0n.methods
			.get_guess(player1.getAddress(), 1n)
			.simulate();
		expect(guess_before.guess_num).toEqual(0n);
		expect(guess_before.status).toEqual(GUESS_STATUS_NULL);

		const tx = await numer0n
			.withWallet(player1)
			.methods.guess_num(player1.getAddress(), guess_num)
			.send()
			.wait();

		console.log("tx: ", tx.txHash.toString());
		expect(tx.status).toBe(TxStatus.SUCCESS);

		const guess_after = await numer0n.methods
			.get_guess(player1.getAddress(), 1n)
			.simulate();
		expect(guess_after.guess_num).toEqual(guess_num);
		expect(guess_after.status).toEqual(GUESS_STATUS_GUESSED);
	});

	it("shouldn fail due to guessing for the second time", async () => {
		const guess_num = 293n;

		await expect(
			numer0n
				.withWallet(player1)
				.methods.guess_num(player1.getAddress(), guess_num)
				.send()
				.wait()
		).rejects.toThrowError(
			"Assertion failed: [guess_num] guess has already been made"
		);
	});

	it("should p2 successfully evaluate p1's guess", async () => {
		const guess_num = 125n;

		const tx = await numer0n
			.withWallet(player2)
			.methods.evaluate_guess(
				player2.getAddress(),
				player1.getAddress(),
				guess_num
			)
			.send()
			.wait();

		console.log("tx: ", tx.txHash.toString());
		expect(tx.status).toBe(TxStatus.SUCCESS);

		const guess = await numer0n.methods
			.get_guess(player1.getAddress(), 1n)
			.simulate();
		expect(guess.eat).toEqual(3n);
		expect(guess.bite).toEqual(0n);
		expect(guess.status).toEqual(GUESS_STATUS_EVALUATED);
	});

	it("shouldn fail as invalid turns for p1", async () => {
		const guess_num = 293n;

		await expect(
			numer0n
				.withWallet(player1)
				.methods.guess_num(player1.getAddress(), guess_num)
				.send()
				.wait()
		).rejects.toThrowError(
			"Assertion failed: [guess_num] invalid turn for player 1"
		);
	});

	it("should p2 successfully call guess_num()", async () => {
		const guess_num = 293n;

		const guess_before = await numer0n.methods
			.get_guess(player2.getAddress(), 1n)
			.simulate();
		expect(guess_before.guess_num).toEqual(0n);
		expect(guess_before.status).toEqual(GUESS_STATUS_NULL);

		const tx = await numer0n
			.withWallet(player2)
			.methods.guess_num(player2.getAddress(), guess_num)
			.send()
			.wait();

		console.log("tx: ", tx.txHash.toString());
		expect(tx.status).toBe(TxStatus.SUCCESS);

		const guess_after = await numer0n.methods
			.get_guess(player2.getAddress(), 1n)
			.simulate();
		expect(guess_after.guess_num).toEqual(guess_num);
		expect(guess_after.status).toEqual(GUESS_STATUS_GUESSED);
	});

	it("should p1 successfully evaluate p2's guess", async () => {
		const guess_num = 293n;

		const tx = await numer0n
			.withWallet(player1)
			.methods.evaluate_guess(
				player1.getAddress(),
				player2.getAddress(),
				guess_num
			)
			.send()
			.wait();

		console.log("tx: ", tx.txHash.toString());
		expect(tx.status).toBe(TxStatus.SUCCESS);

		const guess = await numer0n.methods
			.get_guess(player2.getAddress(), 1n)
			.simulate();
		expect(guess.eat).toEqual(0n);
		expect(guess.bite).toEqual(1n);
		expect(guess.status).toEqual(GUESS_STATUS_EVALUATED);

		// game should be finished
		const game = await numer0n.methods.get_game().simulate();
		expect(game.status).toBe(GAME_STATUS_FINISHED);
		expect(game.winner_id).toBe(1n);
		expect(game.round).toBe(1n);
		expect(game.is_first).toBe(false);
	});
});

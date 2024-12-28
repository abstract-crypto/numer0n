import { AztecAddress, AccountWallet } from "@aztec/aztec.js";

import { Numer0nContract } from "../artifacts/Numer0n.js";

export async function createGame(
	player: AccountWallet,
	gameCode: string
): Promise<AztecAddress | null> {
	try {
		console.log("gameCode: ", gameCode);
		const receipt = await Numer0nContract.deploy(
			player,
			player.getAddress(),
			BigInt(gameCode)
		)
			.send()
			.wait();

		return receipt.contract.address;
	} catch (e) {
		console.log("e: ", e);
		return null;
	}
}

// export async function joinGame(
// 	contractAddress: string,
// 	player: AccountWalletWithSecretKey,
// 	gameCode: bigint
// ) {
// 	try {
// 		const numer0n = await Numer0nContract.at(
// 			AztecAddress.fromString(contractAddress),
// 			player
// 		);
// 		await numer0n.methods
// 			.join_game(player.getAddress(), gameCode)
// 			.send()
// 			.wait();
// 	} catch (e) {
// 		console.log("e: ", e);
// 	}
// }

// export async function addNumber(
// 	player: AccountWalletWithSecretKey,
// 	secert_num: bigint,
// 	contractAddress: string
// ) {
// 	console.log("player: ", player.getAddress().toString());
// 	console.log("secert_num: ", secert_num);
// 	try {
// 		const numer0n = await Numer0nContract.at(
// 			AztecAddress.fromString(contractAddress),
// 			player
// 		);
// 		await numer0n.methods
// 			.add_num(player.getAddress(), secert_num)
// 			.send()
// 			.wait();
// 	} catch (e) {
// 		console.log("e: ", e);
// 	}
// }

// export async function callNumber(
// 	player: AccountWalletWithSecretKey,
// 	opponent: AccountWalletWithSecretKey,
// 	call_num: bigint,
// 	contractAddress: string
// ) {
// 	// try {
// 	// 	const numer0n = await Numer0nContract.at(
// 	// 		AztecAddress.fromString(contractAddress),
// 	// 		player
// 	// 	);
// 	// 	const action = numer0n.methods.call_num(opponent.getAddress(), call_num);
// 	// 	const messageHash = computeAuthWitMessageHash(
// 	// 		player.getAddress(),
// 	// 		action.request()
// 	// 	);
// 	// 	const witness = await opponent.createAuthWitness(messageHash);
// 	// 	await player.addAuthWitness(witness);
// 	// 	await action.send().wait();
// 	// } catch (e) {
// 	// 	console.log("e: ", e);
// 	// }
// }

// export async function guessNumber(
// 	player: AccountWalletWithSecretKey,
// 	contractAddress: string,
// 	guess_num: number
// ) {
// 	try {
// 		const numer0n = await Numer0nContract.at(
// 			AztecAddress.fromString(contractAddress),
// 			player
// 		);
// 		await numer0n.methods
// 			.guess_num(player.getAddress(), guess_num)
// 			.send()
// 			.wait();
// 	} catch (e) {
// 		console.log("e: ", e);
// 	}
// }

// export async function evaluateGuess(
// 	player: AccountWalletWithSecretKey,
// 	guesser: AccountWalletWithSecretKey,
// 	contractAddress: string,
// 	guess_num: number
// ) {
// 	try {
// 		const numer0n = await Numer0nContract.at(
// 			AztecAddress.fromString(contractAddress),
// 			player
// 		);
// 		await numer0n.methods
// 			.evaluate_guess(player.getAddress(), guesser.getAddress(), guess_num)
// 			.send()
// 			.wait();
// 	} catch (e) {
// 		console.log("e: ", e);
// 	}
// }

// // export async function useAttackItem(
// // 	player: AccountWalletWithSecretKey,
// // 	opponent: AccountWalletWithSecretKey,
// // 	item_type: bigint,
// // 	contractAddress: string,
// // 	target_num: bigint
// // ) {
// // 	try {
// // 		const numer0n = await Numer0nContract.at(
// // 			AztecAddress.fromString(contractAddress),
// // 			player
// // 		);

// // 		const action = numer0n.methods.use_attack_item(
// // 			opponent.getAddress(),
// // 			item_type,
// // 			target_num
// // 		);
// // 		const messageHash = computeAuthWitMessageHash(
// // 			player.getAddress(),
// // 			action.request()
// // 		);
// // 		const witness = await opponent.createAuthWitness(messageHash);
// // 		await player.addAuthWitness(witness);

// // 		await action.send().wait();
// // 	} catch (e) {
// // 		console.log("e: ", e);
// // 	}
// // }

// // export async function useDefenseItem(
// // 	player: AccountWalletWithSecretKey,
// // 	item_type: bigint,
// // 	new_secret_num: bigint,
// // 	contractAddress: string
// // ): Promise<boolean> {
// // 	try {
// // 		const numer0n = await Numer0nContract.at(
// // 			AztecAddress.fromString(contractAddress),
// // 			player
// // 		);

// // 		if (item_type == 4n) {
// // 			await numer0n.methods
// // 				.use_change(player.getAddress(), new_secret_num)
// // 				.send()
// // 				.wait();
// // 		} else if (item_type == 5n) {
// // 			await numer0n.methods
// // 				.use_shuffle(player.getAddress(), new_secret_num)
// // 				.send()
// // 				.wait();
// // 		} else {
// // 			return false;
// // 		}

// // 		return true;
// // 	} catch (e) {
// // 		console.log("e: ", e);
// // 		return false;
// // 	}
// // }

// // getters

// export async function getIsFirst(
// 	wallet: Wallet,
// 	contractAddress: string
// ): Promise<boolean> {
// 	const numer0n = await Numer0nContract.at(
// 		AztecAddress.fromString(contractAddress),
// 		wallet
// 	);

// 	return await numer0n.methods.get_is_first().simulate();
// }

// export async function getRound(
// 	wallet: Wallet,
// 	contractAddress: string
// ): Promise<bigint> {
// 	const numer0n = await Numer0nContract.at(
// 		AztecAddress.fromString(contractAddress),
// 		wallet
// 	);
// 	return await numer0n.methods.get_round().simulate();
// }

// export async function getGuess(
// 	wallet: Wallet,
// 	contractAddress: string,
// 	player: AztecAddress,
// 	round: number
// ): Promise<Guess> {
// 	const numer0n = await Numer0nContract.at(
// 		AztecAddress.fromString(contractAddress),
// 		wallet
// 	);

// 	const res = await numer0n.methods.get_guess(player, BigInt(round)).simulate();

// 	return {
// 		guess: Number(res.guess),
// 		eat: Number(res.eat),
// 		bite: Number(res.bite),
// 	};
// }

// export async function getGuesses(
// 	wallet: Wallet,
// 	contractAddress: string,
// 	player: AztecAddress
// ): Promise<Guess[]> {
// 	console.log("getGuesses: ", player.toString(), contractAddress);
// 	const numer0n = await Numer0nContract.at(
// 		AztecAddress.fromString(contractAddress),
// 		wallet
// 	);

// 	const res = await numer0n.methods.get_guesses(player).simulate();

// 	return res;
// }

// export async function getPlayer(
// 	wallet: Wallet,
// 	contractAddress: string,
// 	player: string
// ): Promise<bigint[]> {
// 	const numer0n = await Numer0nContract.at(
// 		AztecAddress.fromString(contractAddress),
// 		wallet
// 	);

// 	const res = await numer0n.methods
// 		.get_player(AztecAddress.fromString(player))
// 		.simulate();

// 	return [res.player_id, res.is_player];
// }

// export async function checkResult(
// 	wallet: Wallet,
// 	contractAddress: string,
// 	call_num: bigint,
// 	secert_num: bigint
// ): Promise<bigint[]> {
// 	const numer0n = await Numer0nContract.at(
// 		AztecAddress.fromString(contractAddress),
// 		wallet
// 	);
// 	const res = await numer0n.methods
// 		.check_result(call_num, secert_num)
// 		.simulate();
// 	return [res.eat, res.bite];
// }

// export async function isValidNum(
// 	wallet: Wallet,
// 	contractAddress: string,
// 	num: bigint
// ): Promise<boolean> {
// 	const numer0n = await Numer0nContract.at(
// 		AztecAddress.fromString(contractAddress),
// 		wallet
// 	);
// 	return await numer0n.methods.is_valid_nums(num).simulate();
// }

// // export async function getIsValidChange(
// // 	current_num: bigint,
// // 	new_num: bigint,
// // 	contractAddress: string
// // ): Promise<boolean> {
// // 	const numer0n = await Numer0nContract.at(
// // 		AztecAddress.fromString(contractAddress),
// // 		new SignerlessWallet(pxe())
// // 	);

// // 	return await numer0n.methods
// // 		.is_valid_new_changed_num(current_num, new_num)
// // 		.simulate();
// // }

// // export async function getIsValidShuffle(
// // 	current_num: bigint,
// // 	new_num: bigint,
// // 	contractAddress: string
// // ): Promise<boolean> {
// // 	const numer0n = await Numer0nContract.at(
// // 		AztecAddress.fromString(contractAddress),
// // 		new SignerlessWallet(pxe())
// // 	);

// // 	return await numer0n.methods
// // 		.is_valid_new_shuffled_num(current_num, new_num)
// // 		.simulate();
// // }

// export async function getIfPlayersAdded(
// 	wallet: Wallet,
// 	contractAddress: string
// ): Promise<boolean> {
// 	const game = await getGame(wallet, contractAddress);
// 	if (game.players[0] != 0n && game.players[1] != 0n) {
// 		return true;
// 	} else {
// 		return false;
// 	}
// }

// export async function getPlayerAddr(
// 	wallet: Wallet,
// 	player_id: number,
// 	contractAddress: string
// ): Promise<string> {
// 	const game = await getGame(wallet, contractAddress);
// 	// console.log("game: ", game);

// 	const addr = fromBigIntToHexStrAddress(game.players[player_id - 1]);
// 	// console.log("addr getPlayerAddr: ", addr);
// 	return addr;
// }

// export async function getIsFinished(
// 	wallet: Wallet,
// 	contractAddress: string
// ): Promise<boolean> {
// 	const game = await getGame(wallet, contractAddress);
// 	return game.finished;
// }

// export async function getWinner(
// 	wallet: Wallet,
// 	contractAddress: string
// ): Promise<bigint> {
// 	const numer0n = await Numer0nContract.at(
// 		AztecAddress.fromString(contractAddress),
// 		wallet
// 	);

// 	return numer0n.methods.get_winner().simulate();
// }

// export async function getGameStatus(
// 	wallet: Wallet,
// 	contractAddress: string
// ): Promise<bigint> {
// 	const game = await getGame(wallet, contractAddress);
// 	return game.status;
// }

// export async function getGame(wallet: Wallet, contractAddress: string) {
// 	const numer0n = await Numer0nContract.at(
// 		AztecAddress.fromString(contractAddress),
// 		wallet
// 	);

// 	return await numer0n.methods.get_game().simulate();
// }

// const fromBigIntToHexStrAddress = (addr: bigint) => {
// 	// return "0x" + BigInt(addr).toString(16);
// 	return AztecAddress.fromBigInt(addr).toString();
// };

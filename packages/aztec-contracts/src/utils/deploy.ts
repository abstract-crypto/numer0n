import {
	Fr,
	PXE,
	AztecAddress,
	AccountWalletWithSecretKey,
	ExtendedNote,
	Note,
} from "@aztec/aztec.js";
import { Numer0nContract } from "../artifacts/Numer0n.js";
import { addGameIdNote } from "../utils/add_note.js";
import { DeployTxReceipt } from "node_modules/@aztec/aztec.js/dest/contract/deploy_sent_tx.js";

export const setup = async (
	pxe: PXE,
	deployer: AccountWalletWithSecretKey,
	player1: AccountWalletWithSecretKey,
	player2: AccountWalletWithSecretKey
): Promise<any> => {
	const game_id = 123n;

	const receipt = await Numer0nContract.deploy(
		deployer,
		player1.getAddress(),
		game_id
	)
		.send()
		.wait();

	const numer0n = receipt.contract;

	// Add the contract public key to the PXE
	//await pxe.registerRecipient(receipt.contract.partialAddress);

	// await addGameIdNote(
	// 	pxe,
	// 	player1.getAddress(),
	// 	numer0n.address,
	// 	receipt.txHash,
	// 	new Fr(game_id)
	// );

	await numer0n
		.withWallet(player2)
		.methods.join_game(player2.getAddress())
		.send()
		.wait();

	return numer0n;
};

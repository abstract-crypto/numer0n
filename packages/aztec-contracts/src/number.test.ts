import {
	initAztecJs,
	Fr,
	PXE,
	createPXEClient,
	AztecAddress,
	AccountWalletWithSecretKey,
} from "@aztec/aztec.js";
import { beforeAll, it, describe, expect } from "vitest";

// yarn test src/number.test.ts

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { getInitialTestAccountsWallets } from "@aztec/accounts/testing";
import { Numer0nContract } from "./artifacts/Numer0n.js";
import { SANDBOX_URL } from "./utils/constants.js";

let pxe: PXE;
let numer0n: Numer0nContract;

let player1: AccountWalletWithSecretKey;
let player2: AccountWalletWithSecretKey;
let deployer: AccountWalletWithSecretKey;

let player1Addr: AztecAddress;
let player2Addr: AztecAddress;

// Setup: Set the sandbox
beforeAll(async () => {
	pxe = createPXEClient(SANDBOX_URL);

	await initAztecJs();
	const accounts = await getInitialTestAccountsWallets(pxe);
	player1 = accounts[0];
	player2 = accounts[1];
	deployer = accounts[2];

	player1Addr = player1.getAddress();
	player2Addr = player2.getAddress();
}, 120_000);

describe("E2E Numer0n", () => {
	describe("deploy_numer0n contract(..)", () => {
		// Setup: Deploy the oracle
		beforeAll(async () => {
			const gameSecretCode = 123n;
			// const gameSecretCodeHash = poseidon2Hash([gameSecretCode])

			const receipt = await Numer0nContract.deploy(
				deployer,
				player1Addr,
				gameSecretCode
			)
				.send()
				.wait();

			numer0n = receipt.contract;

			await numer0n
				.withWallet(player2)
				.methods.join_game(player2Addr, gameSecretCode)
				.send()
				.wait();
		}, 120_000);

		it.skip("check result 1", async () => {
			const call_num = 932n;
			const secret_num = 293n;

			const ret = await numer0n.methods
				.check_result(call_num, secret_num)
				.simulate();
			console.log("ret: ", ret);

			const call_num2 = 125n;
			const secret_num2 = 486n;
			const ret2 = await numer0n.methods
				.check_result(call_num2, secret_num2)
				.simulate();
			console.log("ret2: ", ret2);

			const call_num3 = 25n;
			const secret_num3 = 406n;
			const ret3 = await numer0n.methods
				.check_result(call_num3, secret_num3)
				.simulate();
			console.log("ret3: ", ret3);

			const call_num4 = 984n;
			const secret_num4 = 460n;
			const ret4 = await numer0n.methods
				.check_result(call_num4, secret_num4)
				.simulate();
			console.log("ret4: ", ret4);
		});

		it.skip("is_valid_nums", async () => {
			const num = 51n;
			const ret = await numer0n.methods.is_valid_nums(num).simulate();
			console.log("ret: ", ret);

			const num2 = 609n;
			const ret2 = await numer0n.methods.is_valid_nums(num2).simulate();
			console.log("ret2: ", ret2);

			const num3 = 250n;
			const ret3 = await numer0n.methods.is_valid_nums(num3).simulate();
			console.log("ret3: ", ret3);
		});

		it.skip("should fail due to invalid nums", async () => {
			await expect(
				numer0n
					.withWallet(player1)
					.methods.add_num(player1Addr, 10n)
					.send()
					.wait()
			).rejects.toThrowError(
				"Assertion failed: number should be bigger than 11 '_num as u32 >= 12'"
			);

			await expect(
				numer0n
					.withWallet(player1)
					.methods.add_num(player1Addr, 1023n)
					.send()
					.wait()
			).rejects.toThrowError(
				"Assertion failed: number should be lower than 988 '_num as u32 <= 987'"
			);

			await expect(
				numer0n
					.withWallet(player1)
					.methods.add_num(player1Addr, 220n)
					.send()
					.wait()
			).rejects.toThrowError(
				"Assertion failed: duplication not allowed '(nums[0] != nums[1]) & (nums[1] != nums[2]) & (nums[2] != nums[0])'"
			);

			await expect(
				numer0n
					.withWallet(player1)
					.methods.add_num(player1Addr, 202n)
					.send()
					.wait()
			).rejects.toThrowError(
				"Assertion failed: duplication not allowed '(nums[0] != nums[1]) & (nums[1] != nums[2]) & (nums[2] != nums[0])'"
			);

			await expect(
				numer0n
					.withWallet(player1)
					.methods.add_num(player1Addr, 122n)
					.send()
					.wait()
			).rejects.toThrowError(
				"Assertion failed: duplication not allowed '(nums[0] != nums[1]) & (nums[1] != nums[2]) & (nums[2] != nums[0])'"
			);
		});

		it.skip("check high & low result", async () => {
			const ret1 = await numer0n.methods.get_high_and_low(145n).simulate();
			expect(ret1).toBe(112n);

			const ret2 = await numer0n.methods.get_high_and_low(365n).simulate();
			expect(ret2).toBe(122n);

			const ret3 = await numer0n.methods.get_high_and_low(361n).simulate();
			expect(ret3).toBe(121n);

			const ret4 = await numer0n.methods.get_high_and_low(851n).simulate();
			expect(ret4).toBe(221n);

			const ret5 = await numer0n.methods.get_high_and_low(612n).simulate();
			expect(ret5).toBe(211n);

			const ret6 = await numer0n.methods.get_high_and_low(948n).simulate();
			expect(ret6).toBe(212n);

			// with zeros.
			const ret7 = await numer0n.methods.get_high_and_low(56n).simulate();
			expect(ret7).toBe(122n);

			const ret8 = await numer0n.methods.get_high_and_low(109n).simulate();
			expect(ret8).toBe(112n);
		});

		it.skip("check high & low result", async () => {
			const ret1 = await numer0n.methods.get_high_and_low(145n).simulate();
			expect(ret1).toBe(112n);

			const ret2 = await numer0n.methods.get_high_and_low(365n).simulate();
			expect(ret2).toBe(122n);

			const ret3 = await numer0n.methods.get_high_and_low(361n).simulate();
			expect(ret3).toBe(121n);

			const ret4 = await numer0n.methods.get_high_and_low(851n).simulate();
			expect(ret4).toBe(221n);

			const ret5 = await numer0n.methods.get_high_and_low(612n).simulate();
			expect(ret5).toBe(211n);

			const ret6 = await numer0n.methods.get_high_and_low(948n).simulate();
			expect(ret6).toBe(212n);

			// with zeros.
			const ret7 = await numer0n.methods.get_high_and_low(56n).simulate();
			expect(ret7).toBe(122n);

			const ret8 = await numer0n.methods.get_high_and_low(109n).simulate();
			expect(ret8).toBe(112n);
		});

		it.skip("check slash ", async () => {
			const ret1 = await numer0n.methods.get_slash(145n).simulate();
			expect(ret1).toBe(4n);

			const ret2 = await numer0n.methods.get_slash(365n).simulate();
			expect(ret2).toBe(3n);

			const ret3 = await numer0n.methods.get_slash(361n).simulate();
			expect(ret3).toBe(5n);

			const ret4 = await numer0n.methods.get_slash(851n).simulate();
			expect(ret4).toBe(7n);

			const ret5 = await numer0n.methods.get_slash(612n).simulate();
			expect(ret5).toBe(5n);

			const ret6 = await numer0n.methods.get_slash(948n).simulate();
			expect(ret6).toBe(5n);

			// with zeros.
			const ret7 = await numer0n.methods.get_slash(56n).simulate();
			expect(ret7).toBe(6n);

			const ret8 = await numer0n.methods.get_slash(109n).simulate();
			expect(ret8).toBe(9n);
		});

		it.skip("check target ", async () => {
			const ret1 = await numer0n.methods.get_target(145n, 1n).simulate();
			expect(ret1).toBe(13n);

			const ret2 = await numer0n.methods.get_target(365n, 6n).simulate();
			expect(ret2).toBe(62n);

			const ret3 = await numer0n.methods.get_target(361n, 1n).simulate();
			expect(ret3).toBe(11n);

			const ret4 = await numer0n.methods.get_target(851n, 0n).simulate();
			expect(ret4).toBe(0n);

			const ret5 = await numer0n.methods.get_target(612n, 2n).simulate();
			expect(ret5).toBe(21n);

			const ret6 = await numer0n.methods.get_target(948n, 321n).simulate();
			expect(ret6).toBe(3210n);

			// with zeros.
			const ret7 = await numer0n.methods.get_target(56n, 0n).simulate();
			expect(ret7).toBe(3n);

			const ret8 = await numer0n.methods.get_target(109n, 9n).simulate();
			expect(ret8).toBe(91n);
		});

		it.skip("check change", async () => {
			let ret;
			ret = await numer0n.methods
				.is_valid_new_changed_num(145n, 145n)
				.simulate();
			expect(ret).toBe(false);

			ret = await numer0n.methods
				.is_valid_new_changed_num(365n, 326n)
				.simulate();
			expect(ret).toBe(false);

			ret = await numer0n.methods
				.is_valid_new_changed_num(361n, 472n)
				.simulate();
			expect(ret).toBe(false);

			// with zeros.
			ret = await numer0n.methods
				.is_valid_new_changed_num(56n, 136n)
				.simulate();
			expect(ret).toBe(false);

			ret = await numer0n.methods
				.is_valid_new_changed_num(109n, 209n)
				.simulate();
			expect(ret).toBe(true);

			ret = await numer0n.methods
				.is_valid_new_changed_num(851n, 861n)
				.simulate();
			expect(ret).toBe(true);

			ret = await numer0n.methods.is_valid_new_changed_num(41n, 51n).simulate();
			expect(ret).toBe(true);
		});

		it("check shuffle", async () => {
			let ret;
			ret = await numer0n.methods
				.is_valid_new_shuffled_num(145n, 365n)
				.simulate();
			expect(ret).toBe(false);

			ret = await numer0n.methods
				.is_valid_new_shuffled_num(365n, 361n)
				.simulate();
			expect(ret).toBe(false);

			ret = await numer0n.methods
				.is_valid_new_shuffled_num(361n, 851n)
				.simulate();
			expect(ret).toBe(false);

			ret = await numer0n.methods
				.is_valid_new_shuffled_num(851n, 612n)
				.simulate();
			expect(ret).toBe(false);

			ret = await numer0n.methods
				.is_valid_new_shuffled_num(612n, 948n)
				.simulate();
			expect(ret).toBe(false);

			ret = await numer0n.methods
				.is_valid_new_shuffled_num(948n, 56n)
				.simulate();
			expect(ret).toBe(false);

			// with zeros.
			ret = await numer0n.methods
				.is_valid_new_shuffled_num(56n, 109n)
				.simulate();
			expect(ret).toBe(false);

			ret = await numer0n.methods
				.is_valid_new_shuffled_num(293n, 329n)
				.simulate();
			console.log("ret: ", ret);
			expect(ret).toBe(true);

			ret = await numer0n.methods
				.is_valid_new_shuffled_num(109n, 901n)
				.simulate();
			expect(ret).toBe(true);

			ret = await numer0n.methods
				.is_valid_new_shuffled_num(851n, 518n)
				.simulate();
			expect(ret).toBe(true);

			ret = await numer0n.methods
				.is_valid_new_shuffled_num(41n, 401n)
				.simulate();
			expect(ret).toBe(true);
		});
	});
});

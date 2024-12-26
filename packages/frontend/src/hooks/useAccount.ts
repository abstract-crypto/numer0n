import { getInitialTestAccountsWallets } from "@aztec/accounts/testing";
import { AccountWalletWithSecretKey } from "@aztec/aztec.js";
import { useEffect } from "react";
import { useState } from "react";
import { usePXE } from "./usePXE";

export function useAccounts() {
	const { pxe } = usePXE();
	const [deployer, setDeployer] = useState<AccountWalletWithSecretKey | null>(
		null
	);
	const [player1, setPlayer1] = useState<AccountWalletWithSecretKey | null>(
		null
	);
	const [player2, setPlayer2] = useState<AccountWalletWithSecretKey | null>(
		null
	);

	useEffect(() => {
		const initAccounts = async () => {
			if (!pxe) return;
			const accounts = await getInitialTestAccountsWallets(pxe);
			setDeployer(accounts[2]);
			setPlayer1(accounts[0]);
			setPlayer2(accounts[1]);
		};
		initAccounts();
	}, [pxe]);

	const getPlayer = (id: number) => {
		if (id === 1) return player1;
		if (id === 2) return player2;
		return null;
	};

	return { deployer, player1, player2, getPlayer };
}

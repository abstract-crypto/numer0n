import { getInitialTestAccountsWallets } from "@aztec/accounts/testing";
import {
	AccountWallet,
	AccountWalletWithSecretKey,
	AztecAddress,
} from "@aztec/aztec.js";
import { useEffect } from "react";
import { useState } from "react";
import { usePXE } from "./usePXE";
import { ObsidionWalletSDK } from "@obsidion/wallet-sdk";
import { fallbackOpenPopup } from "./fallback";
import { Eip1193Account } from "@obsidion/wallet-sdk/eip1193";

const OBSIDON_WALLET_URL = "http://localhost:5173";

export function useAccount() {
	const { pxe } = usePXE();
	const [deployer, setDeployer] = useState<AccountWalletWithSecretKey | null>(
		null
	);

	const [sdk, setSdk] = useState<ObsidionWalletSDK | null>(null);
	const [wallet, setWallet] = useState<Eip1193Account | undefined>(undefined);

	useEffect(() => {
		if (!pxe) return;
		if (!sdk) {
			const sdk = new ObsidionWalletSDK(pxe, {
				fallbackOpenPopup: fallbackOpenPopup,
				walletUrl: OBSIDON_WALLET_URL,
			});
			setSdk(sdk);
			return;
		}
		const unsubscribe = sdk.accountObservable.subscribe((account) => {
			setWallet(account);
		});
		return () => unsubscribe();
	}, [pxe, sdk]);

	useEffect(() => {
		const initAccounts = async () => {
			if (!pxe) return;
			const accounts = await getInitialTestAccountsWallets(pxe);
			setDeployer(accounts[0]);
		};
		initAccounts();
	}, [pxe]);

	const connectWallet = async () => {
		if (!pxe) return;

		const sdk = new ObsidionWalletSDK(pxe, {
			fallbackOpenPopup: fallbackOpenPopup,
			walletUrl: OBSIDON_WALLET_URL,
		});
		const wallet = await sdk.connect();
		setWallet(wallet);
		setSdk(sdk);
	};

	const disconnectWallet = () => {
		if (!sdk) return;
		sdk.disconnect();
		setWallet(undefined);
		setSdk(null);
	};

	return {
		deployer,
		wallet,
		connectWallet,
		disconnectWallet,
	};
}

import { getInitialTestAccountsWallets } from "@aztec/accounts/testing";
import { AccountWalletWithSecretKey } from "@aztec/aztec.js";
import { useEffect } from "react";
import { useState } from "react";
import { usePXE } from "./usePXE";
import { ObsidionWalletSDK } from "@obsidion/wallet-sdk";
import { fallbackOpenPopup } from "./fallback";
import { Eip1193Account } from "@obsidion/wallet-sdk/eip1193";

const getWalletURL = () => {
	if (import.meta.env.VITE_ENV === "LOCAL") {
		return "http://localhost:5173";
	} else {
		if (import.meta.env.VITE_ENV === "REMOTE") {
			return "https://obsidion.vercel.app";
		} else {
			throw new Error("Invalid wallet URL environment variable");
		}
	}
};

export function useAccount() {
	const { pxe, pxeURL, setPXEURL } = usePXE();
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
				walletUrl: getWalletURL(),
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
			walletUrl: getWalletURL(),
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
		pxe,
		pxeURL,
		setPXEURL,
		deployer,
		wallet,
		connectWallet,
		disconnectWallet,
	};
}

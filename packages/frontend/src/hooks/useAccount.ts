import { getInitialTestAccountsWallets } from "@aztec/accounts/testing";
import { AccountWalletWithSecretKey } from "@aztec/aztec.js";
import { useEffect, useState } from "react";
import { ObsidionWalletSDK } from "@obsidion/wallet-sdk";
import { Eip1193Account } from "@obsidion/wallet-sdk/eip1193";
import { hasVal } from "src/scripts";
import { usePXE } from "./usePXE";
import { fallbackOpenPopup } from "./fallback";

const getWalletURL = () => {
	if (import.meta.env.VITE_WALLET_URL) {
		return import.meta.env.VITE_WALLET_URL;
	} else {
		if (import.meta.env.VITE_ENV === "LOCAL") {
			return "http://localhost:5173";
		} else if (import.meta.env.VITE_ENV === "REMOTE") {
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
		if (!hasVal(pxe, "pxe", "useAccount")) return;
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
			console.log("initAccounts...");
			if (!hasVal(pxe, "pxe", "useAccount")) return;
			const accounts = await getInitialTestAccountsWallets(pxe);
			setDeployer(accounts[0]);
		};
		initAccounts();
	}, [pxe]);

	const connectWallet = async () => {
		if (!hasVal(pxe, "pxe", "useAccount")) return;

		const sdk = new ObsidionWalletSDK(pxe, {
			fallbackOpenPopup: fallbackOpenPopup,
			walletUrl: getWalletURL(),
		});
		const wallet = await sdk.connect();
		setWallet(wallet);
		setSdk(sdk);
	};

	const disconnectWallet = () => {
		if (!hasVal(sdk, "sdk", "useAccount")) return;
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

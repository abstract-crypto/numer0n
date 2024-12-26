import { useEffect, useState } from "react";
import { createPXEClient, PXE } from "@aztec/aztec.js";
// import { SANDBOX_URL } from "src/scripts/constants";

const DEFAULT_PXE_URL = "https://cdc2-185-115-4-23.ngrok-free.app";

// TODO: when pxe changed, many updates/reset are needed probably around local storage
export function usePXE() {
	const [pxeURL, setPXEURL] = useState<string>(() => {
		// Initialize pxeURL from localStorage if available
		return localStorage.getItem("pxeURL") || DEFAULT_PXE_URL;
	});

	// console.log("pxeURL", pxeURL);
	const [pxe, setPXE] = useState<PXE | null>(null);

	useEffect(() => {
		if (pxeURL) {
			// Save pxeURL to localStorage
			localStorage.setItem("pxeURL", pxeURL);
			// Instantiate pxe with the new pxeURL
			const client = createPXEClient(pxeURL);
			setPXE(client);
		} else {
			// If pxeURL is null, remove it from localStorage and reset pxe
			localStorage.removeItem("pxeURL");
			setPXE(null);
		}
	}, [pxeURL]);

	return { pxe, pxeURL, setPXEURL };
}

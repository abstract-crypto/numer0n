import { useEffect, useState } from "react";
import { createPXEClient, PXE } from "@aztec/aztec.js";

export const getDefaultPXEURL = () => {
	if (import.meta.env.VITE_PXE_URL) {
		return import.meta.env.VITE_PXE_URL;
	} else {
		if (import.meta.env.VITE_ENV === "LOCAL") {
			return "http://localhost:8080/";
		} else if (import.meta.env.VITE_ENV === "REMOTE") {
			return "https://pxe.obsidion.xyz";
		} else {
			throw new Error("Invalid PXE URL environment variable");
		}
	}
};

export function usePXE() {
	const [pxeURL, setPXEURL] = useState<string>(() => {
		// Initialize pxeURL from localStorage if available
		return localStorage.getItem("pxeURL") || getDefaultPXEURL();
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

/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_ENV: string;
	readonly VITE_PXE_URL: string;
	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

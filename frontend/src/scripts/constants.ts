export const REGISTRY_ADDRESS =
	import.meta.env.VITE_ENV == "LOCAL"
		? "0x0ecf8535eb0c5b5b99d877b0456db6b57f7a30d271de1e93fc5648cc28fb02cf"
		: import.meta.env.VITE_ENV == "REMOTE"
		? "0x06067adacaf42c14ae3d455e5c7b537d27c1663681346e37bd022e4ff0924d76"
		: "";

export const SANDBOX_URL =
	import.meta.env.VITE_ENV == "LOCAL"
		? "http://127.0.0.1:8080"
		: import.meta.env.VITE_ENV == "REMOTE"
		? "https://aztec-pxe.abstract-crypto.com"
		: "";

export const SANDBOX_ADDRESS_1 =
	"0x2fd4503a9b855a852272945df53d7173297c1469cceda31048b85118364b09a3";
export const SANDBOX_ADDRESS_2 =
	"0x054ae9af363c6388cc6242c6eb0ed8a5860c15290744c81ecd5109434f9bb8b1";
export const SANDBOX_ADDRESS_3 =
	"0x0d919c38d75484f8dd410cebaf0e17ccd196901d554d88f81b7e079375a4335d";

export const numLen = 3;

export const item = (num: number) => {
	console.log("num num:  ");
	if (num == 1) {
		return "H&L";
	} else if (num == 2) {
		return "Slash";
	} else if (num == 5) {
		return "Shuffle";
	} else {
		return "";
	}
};

export const HighLow = (num: number) => {
	if (num == LOW_lOW_LOW) {
		return "↓↓↓";
	} else if (num == LOW_HIGH_lOW) {
		return "↓↑↓";
	} else if (num == LOW_lOW_HIGH) {
		return "↓↓↑";
	} else if (num == LOW_HIGH_HIGH) {
		return "↓↑↑";
	} else if (num == HIGH_HIGH_HIGH) {
		return "↑↑↑";
	} else if (num == HIGH_lOW_HIGH) {
		return "↑↓↑";
	} else if (num == HIGH_HIGH_LOW) {
		return "↑↑↓";
	} else if (num == HIGH_LOW_LOW) {
		return "↑↓↓";
	} else {
		return "";
	}
};

const LOW_lOW_LOW = 111;
const LOW_lOW_HIGH = 112;
const LOW_HIGH_HIGH = 122;
const LOW_HIGH_lOW = 121;
const HIGH_HIGH_HIGH = 222;
const HIGH_HIGH_LOW = 221;
const HIGH_LOW_LOW = 211;
const HIGH_lOW_HIGH = 212;

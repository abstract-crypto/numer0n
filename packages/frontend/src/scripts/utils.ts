export function shortenAddress(address: string) {
	return (
		address.substring(0, 6) + "..." + address.substring(address.length - 5)
	);
}

export async function delay(sec: number) {
	await new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

export async function paddHeadZero(nums: number[]) {
	return nums.unshift(0);
}

export function stringfyAndPaddZero(num: number) {
	if (num != 0 && num < 100) {
		return "0" + num.toString();
	} else {
		return num.toString();
	}
}

export function hasVal<T>(
	value: T | null | undefined,
	name: string,
	place?: string
): value is NonNullable<T> {
	if (value == null || value === undefined) {
		console.log(`${name} not found at ${place}`);
		return false;
	}
	return true;
}

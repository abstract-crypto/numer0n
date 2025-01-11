import { AztecAddress, FunctionSelector } from "@aztec/aztec.js";
import {
	Modal,
	Text,
	Button,
	Box,
	Group,
	Divider,
	Center,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useAccountContext, useGameContext } from "src/contexts";

type EnableSessionKeyModalType = {
	isOpen: boolean;
	onClose: () => void;
};

function EnableSessionKeyModal({ isOpen, onClose }: EnableSessionKeyModalType) {
	const { wallet } = useAccountContext();
	const { numer0nContractService } = useGameContext();
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [isSessionKeyEnabled, setIsSessionKeyEnabled] = useState(() => {
		const isSessionKeyEnabled = localStorage.getItem(
			"numer0n_session_key_enabled"
		);
		return isSessionKeyEnabled ? JSON.parse(isSessionKeyEnabled) : false;
	});

	const saveSessionKeyEnabled = () => {
		setIsSessionKeyEnabled(true);
		localStorage.setItem("numer0n_session_key_enabled", JSON.stringify(true));
	};

	useEffect(() => {
		let timer: NodeJS.Timeout;
		if (success) {
			timer = setTimeout(() => {
				saveSessionKeyEnabled();
				onClose();
			}, 5000);
		}
		return () => clearTimeout(timer);
	}, [success, onClose]);

	const handleEnableSessionKey = async () => {
		if (!numer0nContractService || !wallet) {
			console.log("numer0nContractService or wallet not found");
			return;
		}

		try {
			const numer0nContract = await numer0nContractService.getNumer0nContract();

			const addresses = [numer0nContract.address, numer0nContract.address];
			const selectors: FunctionSelector[] = [];
			const functionNames: string[] = [];

			const guessNumberMethod = numer0nContract.methods
				.guess_num(wallet.getAddress(), 1)
				.request();

			selectors.push(guessNumberMethod.selector);
			functionNames.push(guessNumberMethod.name);

			const evaluateGuessMethod = numer0nContract.methods
				.evaluate_guess(wallet.getAddress(), AztecAddress.ZERO, 1)
				.request();

			selectors.push(evaluateGuessMethod.selector);
			functionNames.push(evaluateGuessMethod.name);

			await wallet.addSessionKeys(addresses, selectors, functionNames);
			setSuccess(true);
			setTimeout(() => {
				onClose();
			}, 5000);
		} catch (error) {
			console.error(error);
			setError("Failed to enable session key");
		}
	};

	return (
		<Modal
			size="md"
			opened={isOpen}
			onClose={onClose}
			withCloseButton={false}
			centered
		>
			<Box p="md" bg="white" c="black" ta="center">
				{isSessionKeyEnabled ? (
					<Text size="lg" mt="md" mb="lg">
						Blind Sign Mode is already enabled.
					</Text>
				) : (
					<>
						{!success ? (
							<>
								<Text size="lg" mt="md" mb="lg">
									<b>Enable Blind Sign Mode?</b>
								</Text>
								<Text size="sm" mb="lg">
									Blind Sign Mode allows you to play the game without having to
									confirm transactions on popup every time. <br />
									<br />
									Powered by Obsidion Wallet's session key feature.
								</Text>
								<Divider my="sm" />
								{error && <Text c="red">{error}</Text>}
								<Center mt="lg" mb="md">
									<Group>
										<Button variant="default" onClick={onClose}>
											Close
										</Button>
										<Button onClick={handleEnableSessionKey}>Confirm</Button>
									</Group>
								</Center>
							</>
						) : (
							<Text size="lg" mt="md" mb="lg">
								Blind Sign Mode is successfully enabled!
							</Text>
						)}
					</>
				)}
			</Box>
		</Modal>
	);
}

export default EnableSessionKeyModal;

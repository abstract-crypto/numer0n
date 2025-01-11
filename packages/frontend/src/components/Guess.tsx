import { Button, Center, Stack, PinInput, Text, Box } from "@mantine/core";
import { useEffect, useState } from "react";
import { numLen } from "src/scripts";
import { useGameContext, useAccountContext } from "src/contexts";
import { GuessNumModal, EnableSessionKeyModal } from "src/components";
import { notifications } from "@mantine/notifications";

function hasVal<T>(
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

type GuessType = {
	playerId: number;
	isMyTurn: boolean;
	isFinished: boolean;
};

export default function Guess(props: GuessType) {
	const {
		gameService,
		round,
		numer0nContractService,
		numer0nClient,
		updateStates,
	} = useGameContext();
	const { wallet } = useAccountContext();
	const [input, setInput] = useState<string>();
	const [callDisabled, setCallDisabled] = useState<boolean>(true);
	const [calling, setCalling] = useState<boolean>(false);
	const [nums, setNums] = useState<number[]>();
	const [IsCallnumOpen, setOpenCallNumModal] = useState(false);
	const [guess, setGuess] = useState<number[]>([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [showSessionKeyButton, setShowSessionKeyButton] = useState(false);
	const [isSessionKeyModalOpen, setIsSessionKeyModalOpen] = useState(false);

	function handleInput(input: string) {
		if (input.length != numLen) setCallDisabled(true);
		setInput(input);
	}

	function handleFilledNums(input: string) {
		const inputNums = input.split("").map(Number);
		// dup check
		if (inputNums.length === new Set(inputNums).size) {
			setCallDisabled(false);
			setNums(inputNums);
			setErrorMessage("");
		} else {
			setCallDisabled(true);
			// duplicate check
			setErrorMessage("Numbers are duplicated");
		}
	}

	async function handleCall() {
		console.log("handleCall...");
		setErrorMessage("");
		if (!hasVal(wallet, "wallet")) {
			setErrorMessage("Wallet not found");
			return;
		}

		if (!hasVal(gameService, "gameService")) {
			setErrorMessage("Game service not found");
			return;
		}
		if (!hasVal(numer0nContractService, "numer0nContractService")) {
			setErrorMessage("Numer0n contract service not found");
			return;
		}
		if (!hasVal(numer0nClient, "numer0nClient")) {
			setErrorMessage("Numer0n client not found");
			return;
		}
		if (!hasVal(nums, "nums")) {
			setErrorMessage("Nums not found");
			return;
		}

		if (props.isFinished) {
			setErrorMessage("Game is over");
			setCalling(false);
			return;
		} else if (!props.isFinished && !props.isMyTurn) {
			setErrorMessage("Not your turn");
			setCalling(false);
			return;
		}

		try {
			setCalling(true);

			const num = Number(nums.join(""));
			console.log(num);

			console.log("playerId :", props.playerId);

			notifications.show({
				title: "Sending guess...",
				message: `Your guess: ${num}`,
				withCloseButton: true,
				position: "top-right",
				autoClose: 5000,
			});

			await numer0nContractService.guessNumber(num);

			notifications.show({
				title: "Guess Sent. Sending evaluation request...",
				message: `Your guess: ${num}`,
				withCloseButton: true,
				position: "top-right",
				autoClose: 5000,
			});

			await numer0nClient.sendEvaluateGuessRequest(num);

			notifications.show({
				title: "Evaluation done. Loading evaluation result...",
				message: `Your guess: ${num}`,
				withCloseButton: true,
				position: "top-right",
				autoClose: 5000,
			});

			console.log("round: ", round);
			if (round == null) {
				console.log("[Call.tsx] round is null");
				setErrorMessage("Round is null");
				return;
			}
			const guess = await numer0nContractService.getGuess(
				wallet.getAddress(),
				round
			);
			console.log("call guess: ", guess);
			// await delay(3);
			if (guess.guess != 0) {
				setGuess([guess.guess, guess.eat, guess.bite]);
				openModal();
				await updateStates();
			}
		} finally {
			setCalling(false);
		}
	}

	const openModal = () => {
		if (!props.isFinished) {
			setOpenCallNumModal(true);
		}
	};

	// Function to close the modal from the parent
	const closeModal = () => {
		setGuess([]);
		setOpenCallNumModal(false);
	};

	useEffect(() => {
		if (window !== window.parent) {
			console.log("parent exists");
			setShowSessionKeyButton(true);
		} else {
			console.log("child or different parent");
			setShowSessionKeyButton(false);
		}
	}, []);

	return (
		<>
			<Center>
				<Stack align="center">
					<Stack>
						<PinInput
							type={/^[0-9]*$/}
							inputType="number"
							inputMode="numeric"
							autoFocus={true}
							value={input}
							onChange={handleInput}
							length={numLen}
							size="xl"
							onComplete={handleFilledNums}
						/>
						<Button
							variant="filled"
							style={{ border: "1px solid lightblue" }}
							loading={calling}
							onClick={handleCall}
							disabled={callDisabled}
						>
							Submit Guess
						</Button>
						{errorMessage ? (
							<Text c={"red"} style={{ textAlign: "center" }}>
								{errorMessage}
							</Text>
						) : (
							""
						)}
					</Stack>
					{showSessionKeyButton && (
						<Box>
							<Text
								mt={5}
								size="sm"
								c="blue"
								style={{
									textDecoration: "underline",
									cursor: "pointer",
								}}
								onClick={() => setIsSessionKeyModalOpen(true)}
							>
								Enable Blind Sign Mode?
							</Text>
						</Box>
					)}
				</Stack>
			</Center>
			<GuessNumModal
				isOpen={IsCallnumOpen}
				onClose={closeModal}
				guess={guess}
			/>
			<EnableSessionKeyModal
				isOpen={isSessionKeyModalOpen}
				onClose={() => setIsSessionKeyModalOpen(false)}
			/>
		</>
	);
}

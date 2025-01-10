import { Button, Center, Stack, PinInput, Text, Box } from "@mantine/core";
import { useEffect, useState } from "react";
import { numLen } from "../scripts/constants";
import { useGameContext, useAccountContext } from "../contexts";
import GuessNumModal from "./Modals/GuessNumModal";
import EnableSessionKeyModal from "./Modals/EnableSessionKey";

type CallType = {
	playerId: number;
	isMyTurn: boolean;
	isFinished: boolean;
};

export default function Call(props: CallType) {
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
		if (!gameService) {
			console.log("Game data not found");
			return;
		}

		if (!numer0nContractService) {
			console.log("Numer0n contract service not found");
			return;
		}

		if (!numer0nClient) {
			console.log("Numer0n client not found");
			return;
		}

		if (!nums) return;
		setErrorMessage("");
		if (props.isFinished) {
			setErrorMessage("Game is over");
			setCalling(false);
			return;
		} else if (!props.isMyTurn) {
			setErrorMessage("Not your turn");
			setCalling(false);
			return;
		}
		try {
			setCalling(true);

			const num = Number(nums.join(""));
			console.log(num);

			console.log("playerId :", props.playerId);

			if (!wallet) {
				console.log("wallet not found");
				return;
			}

			await numer0nContractService.guessNumber(num);
			console.log("sendEvaluateGuessRequest...");
			console.log("num: ", num);
			await numer0nClient.sendEvaluateGuessRequest(num);

			// TODO: loading forever...

			console.log("round: ", round);
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

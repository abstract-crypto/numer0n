import { Button, Center, Stack, PinInput, Text } from "@mantine/core";
import { useState } from "react";
import { numLen } from "../scripts/constants";
import { useGameContext } from "../contexts/useGameContext";
import GuessNumModal from "./Modals/GuessNumModal";
import { useAccountContext } from "src/contexts/useAccountContext";

type CallType = {
	playerId: number;
	isMyTurn: boolean;
	isFinished: boolean;
	updateStates: () => Promise<void>;
};

export default function Call(props: CallType) {
	const { gameData, round, numer0nService, numer0nClient } = useGameContext();
	// const { wallet, opponent } = useAccounts();
	const { wallet } = useAccountContext();
	const [input, setInput] = useState<string>();
	const [callDisabled, setCallDisabled] = useState<boolean>(true);
	const [calling, setCalling] = useState<boolean>(false);
	const [nums, setNums] = useState<number[]>();
	const [IsCallnumOpen, setOpenCallNumModal] = useState(false);
	const [guess, setGuess] = useState<number[]>([]);
	const [errorMessage, setErrorMessage] = useState("");

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
		if (!gameData) {
			console.log("Game data not found");
			return;
		}

		if (!numer0nService) {
			console.log("Numer0n service not found");
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
			// const player = gameData.getSelf().id == 1 ? player1 : player2;
			// if (!player) return;

			if (!wallet) {
				console.log("wallet not found");
				return;
			}

			await numer0nService.guessNumber(num);
			console.log("sendEvaluateGuessRequest...");
			console.log("num: ", num);
			await numer0nClient.sendEvaluateGuessRequest(num);

			// TODO: loading forever...

			console.log("round: ", round);
			const guess = await numer0nService.getGuess(wallet.getAddress(), round);
			console.log("call guess: ", guess);
			// await delay(3);
			if (guess.guess != 0) {
				setGuess([guess.guess, guess.eat, guess.bite]);
				openModal();
				await props.updateStates();
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

	return (
		<>
			<Center>
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
			</Center>
			<GuessNumModal
				isOpen={IsCallnumOpen}
				onClose={closeModal}
				guess={guess}
			/>
		</>
	);
}

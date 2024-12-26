/* eslint-disable react-hooks/exhaustive-deps */
import {
	Modal,
	Text,
	Button,
	Box,
	Group,
	Divider,
	Center,
	Stack,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { stringfyAndPaddZero } from "../../scripts/utils";

type GuessNumModalType = {
	isOpen: boolean;
	onClose: () => void;
	guess: number[];
};

type GuessResult = {
	guess: string;
	eat: number;
	bite: number;
};

const emptyResult: GuessResult = {
	guess: "0",
	eat: 0,
	bite: 0,
};

function GuessNumModal(props: GuessNumModalType) {
	const [guessResult, setGuessResult] = useState<GuessResult>(emptyResult);

	const handleResult = () => {
		const newResult: GuessResult = {
			guess: stringfyAndPaddZero(props.guess[0]),
			eat: props.guess[1],
			bite: props.guess[2],
		};

		console.log("moda; newResult] ", newResult);
		setGuessResult(newResult);
	};

	useEffect(() => {
		console.log("guessResult?.guess: ", guessResult.guess);
		if (props.isOpen && guessResult.guess == "0") {
			handleResult();
			const intervalId = setInterval(handleResult, 10000);
			return () => {
				clearInterval(intervalId);
			};
		}
	}, [handleResult]);

	const handleClose = () => {
		setGuessResult(emptyResult);
		props.onClose();
	};

	return (
		<Modal
			size="xs"
			opened={props.isOpen}
			onClose={handleClose}
			centered
			withCloseButton={false}
		>
			<Box
				style={{
					backgroundColor: "#white",
					color: "black",
					textAlign: "center",
				}}
			>
				<Text size="lg" mt={5} mb={10} style={{ fontSize: "20px" }}>
					Guess Result
				</Text>
				<Box
					style={{
						margin: "auto",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Group align="stretch" mb={15}>
						<Stack
							gap="5px"
							style={{
								fontSize: 16,
								textAlign: "start",
								marginRight: "2rem",
							}}
						>
							<Text>- Guess:</Text>
							<Text>- Eat:</Text>
							<Text>- Bite:</Text>
						</Stack>
						<Stack gap="5px" style={{ fontSize: 16, textAlign: "center" }}>
							<Text>{guessResult?.guess}</Text>
							<Text>{guessResult?.eat}</Text>
							<Text>{guessResult?.bite}</Text>
						</Stack>
					</Group>
				</Box>
				<Divider my="sm" />
				<Center mt={15} mb={5}>
					<Group>
						<Button color="gray" onClick={handleClose}>
							Close
						</Button>
					</Group>
				</Center>
			</Box>
		</Modal>
	);
}

export default GuessNumModal;

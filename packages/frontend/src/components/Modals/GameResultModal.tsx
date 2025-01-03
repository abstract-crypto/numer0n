import { Modal, Text, Box, Button } from "@mantine/core";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameContext } from "src/contexts/useGameContext";
import { GAME_STATUS } from "src/services/game";

type GameResultModalType = {
	isOpen: boolean;
	onClose: () => void;
	gameResult: string | null;
	opponentSecretNum: number | null;
};

function GameResultModal(props: GameResultModalType) {
	const navigate = useNavigate();
	const { gameData, numer0nService, status } = useGameContext();
	// const [secretNum, setSecretNum] = useState<number | null>(null);

	// if (props.gameResult === null) {
	// 	return null;
	// }

	const handlePlayAgain = async () => {
		props.onClose();
		if (gameData) {
			await gameData.logout();
		}

		navigate("/");
	};

	// useEffect(() => {
	// 	const checkSecretNum = async () => {
	// 		if (
	// 			props.isOpen &&
	// 			secretNum === null &&
	// 			gameData &&
	// 			numer0nService &&
	// 			status === GAME_STATUS.FINISHED
	// 		) {
	// 			const secretNum = await numer0nService.getSecretNum(
	// 				gameData.getOpponent().address!
	// 			);
	// 			console.log("secretNum in checkSecretNum: ", secretNum);
	// 			setSecretNum(secretNum);
	// 		}
	// 	};

	// 	checkSecretNum();
	// }, [props.isOpen, secretNum, gameData, numer0nService, status]);

	return (
		<Modal size="sm" opened={props.isOpen} onClose={props.onClose} centered>
			<Box
				style={{
					backgroundColor: "#white",
					color: "black",
					textAlign: "center",
				}}
				px={30}
			>
				{props.gameResult == "DRAW" ? (
					<Text fw={700} style={{ fontSize: "25px" }}>
						🙃 Draw game 🙃
					</Text>
				) : props.gameResult == "WIN" ? (
					<Text fw={700} style={{ color: "#dd227f", fontSize: "25px" }}>
						🎉🎉 You Won! 🎉🎉
					</Text>
				) : (
					<Text
						fw={700}
						style={{
							color: "#4169e1",
							fontSize: "25px",
						}}
					>
						{" "}
						😭😭 You Lost 😭😭
					</Text>
				)}

				{props.opponentSecretNum && (
					<Text my={20} size="sm">
						Opponent's secret number is: <br />
						<Text fw={700} mt={10} style={{ fontSize: "25px" }}>
							{props.opponentSecretNum}
						</Text>
					</Text>
				)}

				<Button my={20} size="sm" onClick={handlePlayAgain}>
					Play again
				</Button>
			</Box>
		</Modal>
	);
}

export default GameResultModal;

import { Modal, Text, Box, Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useGameContext } from "src/contexts";

type GameResultModalType = {
	isOpen: boolean;
	onClose: () => void;
	gameResult: string | null;
	opponentSecretNum: number | null;
};

function GameResultModal(props: GameResultModalType) {
	const navigate = useNavigate();
	const { gameService } = useGameContext();
	const handlePlayAgain = async () => {
		props.onClose();
		if (gameService) {
			await gameService.logout();
		}

		navigate("/");
	};

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

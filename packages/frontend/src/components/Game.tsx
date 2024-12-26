import { useEffect, useState } from "react";
import { Box, Container, Group, SimpleGrid, Text } from "@mantine/core";
import PlayerBoard from "./PlayerBoard";
import Call from "./Call";
// import Item from "./Item";
import AddNumMoodal from "./Modals/AddNumModal";
import { useGameContext } from "../contexts/useGameContext";
import CallHistory from "./CallHistory";
import TurnNotificationModal from "./Modals/TurnNotificationModal";
import GameResultModal from "./Modals/GameResultModal";
import { GAME_STATUS } from "src/services/game";

export default function Game() {
	const { gameData, isFirst, round, status, gameResult, updateStates } =
		useGameContext();
	const [IsAddNumModalOpen, setOpenAddNumModal] = useState(false);
	const [IsTurnNotificationModalOpen, setOpenTurnNotificationModal] =
		useState(false);
	const [isGameResultModalOpen, setIsGameResultModalOpen] = useState(false);

	// const [itemUsed, setIsItemUsed] = useState(false);
	const [opponentSecretNum, setOpponentSecretNum] = useState<string>("");
	const [isMyTurn, setIsMyTurn] = useState(false);

	// Add secret num
	useEffect(() => {
		(async () => {
			if (!gameData) {
				console.log("Game data not found");
				return;
			}
			if (gameData.getSecretNumber() == undefined) {
				setOpenAddNumModal(true);
			}
		})();
	}, [gameData]);

	useEffect(() => {
		(async () => {
			if (!gameData) {
				console.log("Game data not found");
				return;
			}
			const _gameData = gameData.getGameData();

			if (round == 0) {
				return;
			}

			if (status == GAME_STATUS.FINISHED) {
				return;
			}

			if (
				(_gameData.self.id == 1 && isFirst) ||
				(_gameData.self.id == 2 && !isFirst)
			) {
				setIsMyTurn(true);
				setOpenTurnNotificationModal(true);
			} else if (
				(_gameData.self.id == 1 && !isFirst) ||
				(_gameData.self.id == 2 && isFirst)
			) {
				setIsMyTurn(false);
				setOpenTurnNotificationModal(false);
			}
		})();
	}, [gameData, isMyTurn, round, status, isFirst]);

	// const usedItem = () => {
	// 	setIsItemUsed(true);
	// };

	const getOpponentSecretNum = (num: string) => {
		// if (game.getGameStatus() == GAME_STATUS.FINISHED) {
		// 	setOpponentSecretNum(num);
		// }
	};

	useEffect(() => {
		if (gameResult !== null) {
			setIsGameResultModalOpen(true);
		}
	}, [gameResult]);

	return (
		<>
			<Container>
				<Box
					mt={20}
					style={{
						padding: "20px",
						backgroundColor: "white",
						borderRadius: "20px",
					}}
				>
					<Group
						grow
						ml={10}
						pb={10}
						style={{
							borderBottomStyle: "solid",
							borderBottomColor: "#c4c3d0",
							borderWidth: "1px",
						}}
					>
						<Text style={{ flex: 1, textAlign: "center" }}>
							Game ID: {gameData ? gameData.getGameCode() : ""}
						</Text>
						{(status == GAME_STATUS.STARTED ||
							status == GAME_STATUS.FINISHED) && (
							<>
								<Text style={{ flex: 1, textAlign: "center" }}>
									{gameResult === null ? (
										<>Who's turn: {isMyTurn ? "You!" : "Opponent"}</>
									) : (
										<>
											This game is over:{" "}
											{gameResult == "DRAW"
												? "draw"
												: gameResult == "WIN"
												? "you won"
												: "you lost"}
										</>
									)}
								</Text>

								<Text style={{ flex: 1, textAlign: "center" }}>
									Round: {round}
								</Text>
							</>
						)}
					</Group>
					<SimpleGrid cols={2}>
						<PlayerBoard isSelf={true} opponentSecretNum={opponentSecretNum} />
						<PlayerBoard isSelf={false} opponentSecretNum={opponentSecretNum} />
					</SimpleGrid>
					<SimpleGrid cols={2}>
						<CallHistory
							isSelf={true}
							// itemUsed={itemUsed}
							// historyUpdated={historyUpdated}
						/>
						<CallHistory
							isSelf={false}
							// itemUsed={itemUsed}
							// historyUpdated={historyUpdated}
						/>
					</SimpleGrid>

					{/* <SimpleGrid cols={2} mx={30} mt={50} pb={100}>
						<Item
							playerId={game.getSelf().id}
							isFirst={game.getIsFirst()!}
							isFinished={game.getGameStatus() == GAME_STATUS.FINISHED}
							usedItem={usedItem}
						/>
						<Call
							playerId={game.getSelf().id}
							isFirst={game.getIsFirst()!}
							isFinished={game.getGameStatus() == GAME_STATUS.FINISHED}
							updateStates={updateStates}
						/>
					</SimpleGrid> */}
					<Box mx={30} mt={50} pb={100}>
						<Call
							playerId={gameData ? gameData.getSelf().id : 0}
							isMyTurn={isMyTurn}
							isFinished={status == GAME_STATUS.FINISHED}
							updateStates={updateStates}
						/>
					</Box>
				</Box>

				<AddNumMoodal
					isOpen={IsAddNumModalOpen}
					onClose={() => setOpenAddNumModal(false)}
				/>
				<TurnNotificationModal
					isOpen={IsTurnNotificationModalOpen}
					onClose={() => setOpenTurnNotificationModal(false)}
				/>
				<GameResultModal
					isOpen={isGameResultModalOpen}
					onClose={() => setIsGameResultModalOpen(false)}
					gameResult={gameResult}
				/>
			</Container>
		</>
	);
}

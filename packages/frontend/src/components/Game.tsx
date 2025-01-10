import { useEffect, useState } from "react";
import { Box, Button, Container, Group, SimpleGrid, Text } from "@mantine/core";
import PlayerBoard from "./PlayerBoard";
import Call from "./Call";
// import Item from "./Item";
import AddNumMoodal from "./Modals/AddNumModal";
import { useGameContext } from "../contexts";
import CallHistory from "./CallHistory";
import TurnNotificationModal from "./Modals/TurnNotificationModal";
import GameResultModal from "./Modals/GameResultModal";
import { GAME_STATUS } from "src/services";

export default function Game() {
	const {
		gameService,
		isFirst,
		round,
		status,
		gameResult,
		numer0nContractService,
		addSessionKeys,
	} = useGameContext();
	const [IsAddNumModalOpen, setOpenAddNumModal] = useState(false);
	const [IsTurnNotificationModalOpen, setOpenTurnNotificationModal] =
		useState(false);
	const [isGameResultModalOpen, setIsGameResultModalOpen] = useState(false);

	// const [itemUsed, setIsItemUsed] = useState(false);
	const [opponentSecretNum, setOpponentSecretNum] = useState<number | null>(
		null
	);
	const [isMyTurn, setIsMyTurn] = useState(false);

	const [showSessionKeyButton, setShowSessionKeyButton] = useState(false);

	// Add secret num
	useEffect(() => {
		(async () => {
			if (!gameService) {
				console.log("Game data not found");
				return;
			}
			if (gameService.getSecretNumber() == undefined) {
				setOpenAddNumModal(true);
			}
		})();
	}, [gameService]);

	useEffect(() => {
		(async () => {
			if (!gameService) {
				console.log("Game data not found");
				return;
			}
			const _gameData = gameService.getGameData();

			if (round == 0) {
				return;
			}

			if (isFirst === null) {
				return;
			}

			if (status !== GAME_STATUS.STARTED) {
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
	}, [gameService, isMyTurn, round, status, isFirst]);

	// const usedItem = () => {
	// 	setIsItemUsed(true);
	// };

	useEffect(() => {
		const checkSecretNum = async () => {
			if (
				opponentSecretNum === null &&
				gameService &&
				numer0nContractService &&
				status === GAME_STATUS.FINISHED
			) {
				const secretNum = await numer0nContractService.getSecretNum(
					gameService.getOpponent().address!
				);
				console.log("secretNum in checkSecretNum: ", secretNum);
				setOpponentSecretNum(secretNum);
			}
		};

		checkSecretNum();
	}, [opponentSecretNum, gameService, numer0nContractService, status]);

	useEffect(() => {
		if (gameResult !== null) {
			setIsGameResultModalOpen(true);
		}
	}, [gameResult]);

	useEffect(() => {
		let parentOrigin = null;

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
						align="center"
						mx={5}
						pb={10}
						style={{
							borderBottomStyle: "solid",
							borderBottomColor: "#c4c3d0",
							borderWidth: "1px",
						}}
					>
						<Text style={{ flex: 1, textAlign: "center" }}>
							Game ID: {gameService ? gameService.getGameCode() : ""}
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
						{showSessionKeyButton && (
							<Box>
								<Button
									size="xs"
									variant="filled"
									onClick={() => addSessionKeys()}
								>
									Enable Session Mode
								</Button>
							</Box>
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
							playerId={gameService ? gameService.getSelf().id : 0}
							isMyTurn={isMyTurn}
							isFinished={status == GAME_STATUS.FINISHED}
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
					opponentSecretNum={opponentSecretNum}
				/>
			</Container>
		</>
	);
}

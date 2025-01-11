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
import { hasVal } from "src/scripts";

export default function Game() {
	const {
		gameService,
		isFirst,
		round,
		status,
		gameResult,
		numer0nContractService,
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
	// Add secret num
	useEffect(() => {
		(async () => {
			if (!hasVal(gameService, "gameService", "Game.tsx")) return;
			if (gameService.getSecretNumber() == undefined) {
				setOpenAddNumModal(true);
				return;
			}

			if (!hasVal(numer0nContractService, "numer0nContractService", "Game.tsx"))
				return;
			if (status !== GAME_STATUS.PLAYERS_SET) {
				console.log("[Game.tsx] status is not PLAYERS_SET");
				return;
			}
			const self = gameService.getSelf().address;
			try {
				const secretNum = await numer0nContractService.getSecretNum(self);
				console.log("secretNum: ", secretNum);
			} catch (e) {
				console.log("e: ", e);
				setOpenAddNumModal(true);
				return;
			}
		})();
	}, [gameService, status, numer0nContractService]);

	useEffect(() => {
		(async () => {
			if (!hasVal(gameService, "gameService", "Game.tsx")) return;
			if (!hasVal(isFirst, "isFirst", "Game.tsx")) return;
			if (!hasVal(round, "round", "Game.tsx")) return;

			const _gameService = gameService.getGameData();

			if (round == 0) {
				console.log("[Game.tsx] round is 0");
				return;
			}

			if (status !== GAME_STATUS.STARTED) {
				console.log("[Game.tsx] status is not started");
				return;
			}

			if (
				(_gameService.self.id == 1 && isFirst) ||
				(_gameService.self.id == 2 && !isFirst)
			) {
				setIsMyTurn(true);
				setOpenTurnNotificationModal(true);
			} else if (
				(_gameService.self.id == 1 && !isFirst) ||
				(_gameService.self.id == 2 && isFirst)
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

	return (
		<Container pt={10} pb={20}>
			<Box
				style={{
					padding: "15px",
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
				<Box mx={30} mt={50} pb={30}>
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
	);
}

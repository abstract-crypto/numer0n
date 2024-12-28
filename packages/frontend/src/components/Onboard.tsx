import { useEffect, useState } from "react";
import {
	Button,
	Container,
	Center,
	Text,
	Stack,
	Box,
	CopyButton,
	Anchor,
} from "@mantine/core";
import { useGameContext } from "../contexts/useGameContext";
// import { createGame, getGame } from "../scripts";
import { useAccounts } from "src/hooks/useAccount";
import { Game, GAME_STATUS, GameStatus } from "src/services/game";
import { useNavigate } from "react-router-dom";
import { Numer0nContractService } from "src/services/numer0n";
import { createGame } from "src/scripts";

export default function Onboard() {
	const [gameData, setGameData] = useState<Game | null>(null);
	const [numer0nService, setNumer0nService] =
		useState<Numer0nContractService | null>(null);
	const { player1, player2 } = useAccounts();
	const navigate = useNavigate();

	const [isGameCreated, setIsGameCreated] = useState<boolean>(false);
	const [loadingCreate, setLoadingCreate] = useState(false);
	const [invitationLink, setInvitationLink] = useState<string>("");
	const [playersSet, setPlayersSet] = useState<boolean>(false);

	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const gameInstance = new Game();
		setGameData(gameInstance);
	}, []);

	useEffect(() => {
		if (!gameData || !gameData.getContractAddress()) {
			console.log("game not found");
			return;
		}

		if (!player1 || !player2) {
			console.log("Players not found");
			return;
		}

		const numer0nService = new Numer0nContractService(
			gameData.getContractAddress(),
			player1,
			player2
		);

		setNumer0nService(numer0nService);
	}, [gameData, player1, player2]);

	useEffect(() => {
		const loadOnboard = async () => {
			if (!gameData) {
				console.log("Game data not found");
				return;
			}

			if (!numer0nService) {
				console.log("Numer0n service not found");
				return;
			}

			const gameCode = gameData.getGameCode();
			const contractAddress = gameData.getContractAddress();
			if (!gameCode || !contractAddress) {
				console.log("Game code or contract address not found");
				return;
			}

			if (!invitationLink) {
				const invitationUrl = `${window.location.origin}/invite?contract=${contractAddress}&secret=${gameCode}`;
				setInvitationLink(invitationUrl);
			}

			// TODO: check if players are set by calling contract
			// and reflect the state in the frontend
			if (!player1 || !player2) {
				console.log("PXE Accounts not found");
				return;
			}

			const fetchedGameData = await numer0nService.getGame();
			console.log("fetchedGameData: ", fetchedGameData);

			if (Number(fetchedGameData.status) === GAME_STATUS.PLAYERS_SET) {
				const game = {
					contractAddress,
					self: {
						id: 1,
						address: player1.getAddress().toString(),
						isOpponent: false,
						guesses: [],
					},
					opponent: {
						id: 2,
						address: player2.getAddress().toString(),
						isOpponent: true,
						guesses: [],
					},
					gameCode: gameData.getGameCode(),
					gameStatus: Number(fetchedGameData.status) as GameStatus,
					round: Number(fetchedGameData.round),
					isFirst: fetchedGameData.isFirst,
					winnerId: null,
				};

				gameData.setGame(game);
				setPlayersSet(true);
			}
		};
		const intervalId = setInterval(loadOnboard, 5000);
		return () => clearInterval(intervalId);
	}, [gameData, player1, player2, invitationLink, numer0nService]);

	useEffect(() => {
		if (playersSet) {
			// Navigate to the desired route when playersSet is true
			navigate("/game"); // Replace "/game" with your target route
			setGameData(null);
			setNumer0nService(null);
			setIsGameCreated(false);
			setInvitationLink("");
			setPlayersSet(false);
			setError(null);
		}
	}, [playersSet, navigate]);

	async function handleCreateNewGame() {
		setError(null);
		setLoadingCreate(false);
		setLoadingCreate(true);

		if (!gameData) {
			console.log("Game data not found");
			setError("Game data not found");
			setLoadingCreate(false);
			return;
		}

		// generate game password
		const gameCode = "0x" + crypto.randomUUID().slice(0, 5);
		console.log("gameCode: ", gameCode);

		if (!player1 || !player2) {
			console.error("Players not found");
			setError("Players not found");
			setLoadingCreate(false);
			return;
		}

		// deploy
		const contractAddress = await createGame(player1, gameCode);
		if (!contractAddress) {
			console.error("Failed to create game");
			setError("Failed to create game");
			setLoadingCreate(false);
			return;
		}
		console.log("contractAddress: ", contractAddress.toString());

		gameData.setContractAddress(contractAddress.toString());
		gameData.setSelf({
			id: 1,
			address: player1.getAddress().toString(),
			guesses: [],
		});

		gameData.setGameCode(gameCode);
		// game.setGameStatus(0);

		const invitationUrl = `${
			window.location.origin
		}/invite?contract=${contractAddress.toString()}&secret=${gameCode}`;
		setInvitationLink(invitationUrl);

		const numer0nService = new Numer0nContractService(
			contractAddress.toString(),
			player1,
			player2
		);

		setNumer0nService(numer0nService);

		setIsGameCreated(true);
		setLoadingCreate(false);
	}

	return (
		<Container mt={100}>
			<Box mb={50}>
				<Text
					style={{
						marginTop: 50,
						fontSize: "35px",
						textAlign: "center",
					}}
				>
					Welcome To Numer0n!
				</Text>
				<Text
					style={{
						marginTop: 20,
						fontSize: "20px",
						textAlign: "center",
					}}
					mx={40}
					mb={50}
				>
					Numer0n is a number-guessing game like a "Hit & Blow". <br /> Built on
					Aztec Sandbox.
				</Text>
			</Box>
			{isGameCreated ? (
				<Stack align="center">
					<Text style={{ textAlign: "center" }}>
						A new game was successfully created! <br />
						Please share the following invite link with your friend and wait for
						them to join:{" "}
					</Text>
					<>
						<CopyButton value={invitationLink}>
							{({ copied, copy }) => (
								<Stack align="center">
									<Anchor
										size="sm"
										onClick={copy}
										style={{ textAlign: "center", cursor: "pointer" }}
									>
										{invitationLink}{" "}
									</Anchor>
									{copied && (
										<Text color="black" mt={3} size="md">
											Copied!
										</Text>
									)}
								</Stack>
							)}
						</CopyButton>{" "}
					</>
				</Stack>
			) : (
				<Center style={{ flexDirection: "column" }}>
					{!isGameCreated && (
						<Button
							style={{ textAlign: "center" }}
							onClick={handleCreateNewGame}
							loading={loadingCreate}
						>
							Create a new game
						</Button>
					)}
					{error && <Text color="red">{error}</Text>}
				</Center>
			)}
		</Container>
	);
}

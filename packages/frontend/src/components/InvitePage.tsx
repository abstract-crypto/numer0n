// InvitePage.jsx
import {
	Box,
	Button,
	Container,
	Group,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGameContext } from "src/contexts/useGameContext";
import { useAccounts } from "src/hooks/useAccount";
// import { getGame, joinGame } from "src/scripts";
import { Game, GAME_STATUS, GameStatus } from "src/services/game";
import { Numer0nContractService } from "src/services/numer0n";

function InvitePage() {
	const [gameData, setGameData] = useState<Game | null>(null);
	const [numer0nService, setNumer0nService] =
		useState<Numer0nContractService | null>(null);
	const navigate = useNavigate();
	const { player1, player2 } = useAccounts();
	const location = useLocation();
	const [contractAddress, setContractAddress] = useState("");
	const [secretCode, setSecretCode] = useState("");
	const [error, setError] = useState("");
	const [loadingCreate, setLoadingCreate] = useState(false);
	const [loadingJoin, setLoadingJoin] = useState(false);
	const [completeJoin, setCompleteJoin] = useState(false);

	useEffect(() => {
		const gameInstance = new Game();
		setGameData(gameInstance);
	}, []);

	useEffect(() => {
		if (!gameData || !contractAddress) {
			console.log("game not found");
			return;
		}

		if (!player1 || !player2) {
			console.log("self or opponent not found");
			return;
		}

		const numer0nService = new Numer0nContractService(
			contractAddress,
			player2,
			player1
		);

		setNumer0nService(numer0nService);
	}, [gameData, player1, player2, contractAddress]);

	useEffect(() => {
		// Parse query params
		const queryParams = new URLSearchParams(location.search);
		const contractAddress = queryParams.get("contract");
		const secret = queryParams.get("secret");

		if (!contractAddress) {
			setError("Invalid contract address");
			return;
		}
		if (!secret) {
			setError("Invalid secret");
			return;
		}

		setContractAddress(contractAddress);
		setSecretCode(secret);

		if (gameData) {
			const contractAddr = gameData.getContractAddress();
			if (contractAddr != contractAddress) {
				gameData.logout();
			}
		}
		// Optionally call a function to validate or initiate a game session
		// validateAndJoinGame(address, secret);
	}, [location, gameData]);

	useEffect(() => {
		if (completeJoin) {
			navigate("/game");
		}
	}, [completeJoin, navigate]);

	// Player 2 joins game
	const handleJoinGame = async () => {
		console.log("handleJoinGame....");
		setLoadingJoin(true);

		if (!gameData) {
			console.log("Game data not found");
			return;
		}

		if (!numer0nService) {
			console.log("Numer0n service not found");
			return;
		}

		if (!player1 || !player2) {
			setError("PXE Accounts not found");
			return;
		}

		await numer0nService.joinGame(BigInt(secretCode));

		const fetchedGameData = await numer0nService.getGame();
		console.log("fetchedGameData: ", fetchedGameData);

		if (Number(fetchedGameData.status) !== GAME_STATUS.PLAYERS_SET) {
			setError("Game wasn't properly set up");
			console.log("fetchedGameData.status: ", fetchedGameData.status);
			return;
		}

		const game = {
			contractAddress,
			self: {
				id: 2,
				address: player2.getAddress().toString(),
				isOpponent: false,
				guesses: [],
			},
			opponent: {
				id: 1,
				address: player1.getAddress().toString(),
				isOpponent: true,
				guesses: [],
			},
			gameCode: secretCode,
			gameStatus: GAME_STATUS.STARTED,
			round: Number(fetchedGameData.round),
			isFirst: fetchedGameData.isFirst,
			winnerId: null,
		};

		gameData.setGame(game);
		setLoadingJoin(false);
		setCompleteJoin(true);
	};

	return (
		<>
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
						Numer0n is a number-guessing game like a "Hit & Blow". <br /> Built
						on Aztec Sandbox.
					</Text>
				</Box>
				<Stack align="center" mt={5} mx={10}>
					<Text size="xl">Game Invitation</Text>
					<Text size="md">Contract Address: {contractAddress}</Text>
					<Text size="md">Secret Code: {secretCode}</Text>
					<Button
						mt={10}
						mx={35}
						variant="filled"
						color="cyan"
						style={{ textAlign: "center" }}
						onClick={handleJoinGame}
						loading={loadingJoin}
					>
						Join game
					</Button>
				</Stack>
			</Container>
		</>
	);
}

export default InvitePage;

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
import { useAccountContext } from "src/contexts/useAccountContext";
import { useGameContext } from "src/contexts/useGameContext";
// import { getGame, joinGame } from "src/scripts";
import { Game, GAME_STATUS, GameData, GameStatus } from "src/services/game";
import { Numer0nContractService } from "src/services/numer0n";
import { Numer0nClient } from "src/services/numer0nClient";

function InvitePage() {
	const {
		gameData,
		numer0nClient,
		contractAddress,
		setContractAddress,
		setNumer0nService,
		setNumer0nClient,
	} = useGameContext();
	const navigate = useNavigate();
	const { wallet } = useAccountContext();
	const location = useLocation();
	const [secretCode, setSecretCode] = useState("");
	const [port, setPort] = useState(0);
	const [error, setError] = useState("");
	const [loadingJoin, setLoadingJoin] = useState(false);
	const [completeJoin, setCompleteJoin] = useState(false);

	console.log("numer0nClient in InvitePage: ", numer0nClient);

	useEffect(() => {
		const fetchGameData = async () => {
			if (!gameData) {
				console.log("Game data not found");
				return;
			}
			if (!wallet) {
				console.log("Wallet not found");
				return;
			}

			// Parse query params
			const queryParams = new URLSearchParams(location.search);
			const secret = queryParams.get("secret");
			const port = queryParams.get("port");

			console.log("secret: ", secret);

			if (!secret) {
				setError("Invalid secret");
				return;
			}

			console.log("port: ", port);
			if (!port) {
				setError("Invalid port");
				return;
			}

			if (!numer0nClient) {
				console.log("Numer0n client not found");
				return;
			}

			// const numer0nService = new Numer0nContractService(wallet);
			// console.log("numer0nService: ", numer0nService);
			// const numer0nClient = new Numer0nClient(numer0nService);
			// console.log("numer0nClient: ", numer0nClient);

			await numer0nClient.connect(Number(port));
			console.log("numer0nClient connected");
			const contractAddress = await numer0nClient.getContractAddress();

			if (!contractAddress) {
				setError("Game data not found");
				return;
			}

			setSecretCode(secret);
			setPort(Number(port));
			setContractAddress(contractAddress);
			gameData.setGamePort(Number(port));
			gameData.setContractAddress(contractAddress);
			gameData.setGameCode(secret);
		};

		fetchGameData();
	}, [location, gameData, wallet, numer0nClient]);

	useEffect(() => {
		if (completeJoin) {
			navigate("/game");
		}
	}, [completeJoin, navigate]);

	// Player 2 joins game
	const handleJoinGame = async () => {
		console.log("handleJoinGame....");
		setLoadingJoin(true);

		if (!gameData || !contractAddress) {
			console.log("Game data and/or contract address not found");
			return;
		}

		if (!wallet) {
			console.log("PXE Accounts not found");
			setError("Connect your wallet to join a game");
			setLoadingJoin(false);
			return;
		}

		// if (!numer0nService) {
		// 	console.log("Numer0n service not found");
		// 	setError("Numer0n service not found");
		// 	setLoadingJoin(false);
		// 	return;
		// }

		// if (!numer0nClient) {
		// 	console.log("Numer0n client not found");
		// 	setError("Numer0n client not found");
		// 	setLoadingJoin(false);
		// 	return;
		// }
		const numer0nService = new Numer0nContractService(
			wallet,
			gameData,
			contractAddress
		);
		const numer0nClient = new Numer0nClient(numer0nService);

		if (!secretCode) {
			console.log("secret code not found");
			setError("Secret code not found");
			setLoadingJoin(false);
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

		// const port = gameData.getGamePort();
		await numer0nClient.connect(port);
		const opponent = await numer0nClient.getOpponent();
		if (!opponent) {
			console.log("opponent not found");
			return;
		}

		// setOpponent(opponent);

		gameData.setSelf({
			id: 2,
			address: wallet.getAddress().toString(),
			guesses: [],
		});
		gameData.setOpponent({
			id: 1,
			address: opponent.toString(),
			guesses: [],
		});

		setNumer0nService(numer0nService);
		setNumer0nClient(numer0nClient);

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
					{/* <Text size="md">Contract Address: {contractAddress}</Text> */}
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
					{error && (
						<Text mt={10} color="red">
							{error}
						</Text>
					)}
				</Stack>
			</Container>
		</>
	);
}

export default InvitePage;

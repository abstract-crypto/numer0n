// InvitePage.jsx
import { Box, Button, Container, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccountContext, useGameContext } from "src/contexts";
import {
	Numer0nContractService,
	Numer0nClient,
	GAME_STATUS,
} from "src/services";

function InvitePage() {
	const {
		gameService,
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
	// const [port, setPort] = useState(0);
	const [error, setError] = useState("");
	const [loadingJoin, setLoadingJoin] = useState(false);
	const [completeJoin, setCompleteJoin] = useState(false);

	console.log("numer0nClient in InvitePage: ", numer0nClient);

	useEffect(() => {
		const fetchGameData = async () => {
			if (!gameService) {
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
			// const port = queryParams.get("port");

			console.log("secret: ", secret);

			if (!secret) {
				setError("Invalid secret");
				return;
			}

			if (!numer0nClient) {
				console.log("Numer0n client not found");
				return;
			}

			// await numer0nClient.connect(Number(port));
			await numer0nClient.connect(secret);
			console.log("numer0nClient connected");
			const contractAddress = await numer0nClient.getContractAddress();

			if (!contractAddress) {
				setError("Game data not found");
				return;
			}

			setSecretCode(secret);
			setContractAddress(contractAddress);
			gameService.setContractAddress(contractAddress);
			gameService.setGameCode(secret);
		};

		fetchGameData();
	}, [location, gameService, wallet, numer0nClient]);

	useEffect(() => {
		if (completeJoin) {
			navigate("/game");
		}
	}, [completeJoin, navigate]);

	// Player 2 joins game
	const handleJoinGame = async () => {
		console.log("handleJoinGame....");
		setLoadingJoin(true);

		if (!gameService || !contractAddress) {
			console.log("Game data and/or contract address not found");
			return;
		}

		if (!wallet) {
			console.log("PXE Accounts not found");
			setError("Connect your wallet to join a game");
			setLoadingJoin(false);
			return;
		}

		const numer0nService = new Numer0nContractService(
			wallet,
			gameService,
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

		await numer0nClient.connect(secretCode);
		const opponent = await numer0nClient.getOpponent();
		if (!opponent) {
			console.log("opponent not found");
			return;
		}

		gameService.setSelf({
			id: 2,
			address: wallet.getAddress().toString(),
			guesses: [],
		});
		gameService.setOpponent({
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
					<Text size="xl">Invitation</Text>
					<Text size="md">Game Id: {secretCode}</Text>
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

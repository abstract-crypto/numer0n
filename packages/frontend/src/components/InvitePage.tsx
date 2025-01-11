import { Button, Container, Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccountContext, useGameContext } from "src/contexts";
import { hasVal } from "src/scripts";
import {
	Numer0nContractService,
	Numer0nClient,
	GAME_STATUS,
} from "src/services";
import OnboardDescription from "./OnboardDescription";

function InvitePage() {
	const {
		gameService,
		numer0nClient,
		contractAddress,
		status,
		setContractAddress,
		setNumer0nService,
		setNumer0nClient,
	} = useGameContext();
	const navigate = useNavigate();
	const { wallet } = useAccountContext();
	const location = useLocation();
	const [secretCode, setSecretCode] = useState("");
	const [error, setError] = useState("");
	const [loadingJoin, setLoadingJoin] = useState(false);
	const [completeJoin, setCompleteJoin] = useState(false);

	console.log("numer0nClient in InvitePage: ", numer0nClient);

	useEffect(() => {
		// Parse query params
		const queryParams = new URLSearchParams(location.search);
		const secret = queryParams.get("secret");
		setSecretCode(secret || "");
	}, [location]);

	useEffect(() => {
		const fetchGameData = async () => {
			console.log("fetchGameData...");
			if (!hasVal(gameService, "gameService", "InvitePage.tsx")) return;
			if (!hasVal(wallet, "wallet", "InvitePage.tsx")) return;
			if (!hasVal(secretCode, "secretCode", "InvitePage.tsx")) return;

			const contractService = new Numer0nContractService(wallet, gameService);
			const numer0nClient = new Numer0nClient(
				secretCode,
				contractService,
				true
			);

			await numer0nClient.connect();
			console.log("numer0nClient connected");
			const contractAddress = await numer0nClient.getContractAddress();

			if (!hasVal(contractAddress, "contractAddress", "InvitePage.tsx")) return;

			setContractAddress(contractAddress);
			gameService.setContractAddress(contractAddress);
			gameService.setGameCode(secretCode);
		};

		fetchGameData();
	}, [location, gameService, wallet, secretCode]);

	useEffect(() => {
		if (completeJoin) {
			navigate("/game");
		}
	}, [completeJoin, navigate]);

	// Player 2 joins game
	const handleJoinGame = async () => {
		console.log("handleJoinGame....");
		setLoadingJoin(true);

		if (!gameService) {
			setError("gameService not found");
			setLoadingJoin(false);
			return;
		}

		if (!contractAddress) {
			setError("Contract address not found");
			setLoadingJoin(false);
			return;
		}

		if (!wallet) {
			setError("wallet not found");
			setLoadingJoin(false);
			return;
		}

		const numer0nService = new Numer0nContractService(
			wallet,
			gameService,
			contractAddress
		);
		const numer0nClient = new Numer0nClient(secretCode, numer0nService);

		if (!secretCode) {
			setError("Secret code not found");
			setLoadingJoin(false);
			return;
		}

		if (status === GAME_STATUS.NULL) {
			await numer0nService.joinGame(BigInt(secretCode));
		}

		const fetchedGameData = await numer0nService.getGame();
		console.log("fetchedGameData: ", fetchedGameData);

		if (Number(fetchedGameData.status) !== GAME_STATUS.PLAYERS_SET) {
			setError("Game wasn't properly set up");
			setLoadingJoin(false);
			return;
		}

		const opponent = await numer0nClient.getOpponent();
		if (!opponent) {
			setError("opponent not found");
			setLoadingJoin(false);
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
				<OnboardDescription />
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

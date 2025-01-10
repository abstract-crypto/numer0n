import { useEffect, useState } from "react";
import { stringfyAndPaddZero } from "src/scripts/utils";
import { useAccountContext } from "src/contexts/useAccountContext";
import {
	GameService,
	GAME_STATUS,
	Guess,
	Numer0nContractService,
	Numer0nClient,
} from "src/services";
export type ResultRow = {
	guess: string;
	eat: string;
	bite: string;
};

export const emptyRow: ResultRow = {
	guess: "",
	eat: "",
	bite: "",
};

export const emptyRows: ResultRow[] = Array(5).fill(emptyRow);

type GameResult = "WIN" | "LOSE" | "DRAW";

export const useGame = () => {
	const { wallet } = useAccountContext();
	const [gameService, setGameService] = useState<GameService | null>(null);
	const [numer0nContractService, setNumer0nService] =
		useState<Numer0nContractService | null>(null);
	const [numer0nClient, setNumer0nClient] = useState<Numer0nClient | null>(
		null
	);

	console.log("wallet in useGame: ", wallet);
	console.log("numer0nContractService in useGame: ", numer0nContractService);
	console.log("numer0nClient in useGame: ", numer0nClient);

	const [resultRowsSelf, setResultRowsSelf] = useState<ResultRow[]>(emptyRows);
	const [resultRowsOpponent, setResultRowsOpponent] =
		useState<ResultRow[]>(emptyRows);

	const [isFirst, setIsFirst] = useState<boolean | null>(null);
	const [round, setRound] = useState(0);
	const [status, setStatus] = useState(0);
	const [gameResult, setGameResult] = useState<GameResult | null>(null);
	console.log("gameResult in useGame: ", gameResult);

	const [contractAddress, setContractAddress] = useState<string | null>(null);

	useEffect(() => {
		setGameService(new GameService());
	}, []);

	useEffect(() => {
		const initNumer0nService = async () => {
			if (!gameService) {
				console.log("game not found: ", gameService);
				return;
			}

			if (!wallet) {
				console.log("wallet not found: ", wallet);
				return;
			}

			const contractAddr = contractAddress ?? gameService.getContractAddress();
			console.log("contractAddr: ", contractAddr);

			const numer0nContractService = new Numer0nContractService(
				wallet,
				gameService,
				contractAddr
			);
			setNumer0nService(numer0nContractService);
		};

		initNumer0nService();
	}, [gameService, wallet, contractAddress]);

	useEffect(() => {
		const initNumer0nClient = async () => {
			if (!gameService) {
				console.log("gameService not found");
				return;
			}
			if (!numer0nContractService) {
				console.log("numer0nContractService not found");
				return;
			}
			try {
				const numer0nClient = new Numer0nClient(numer0nContractService);
				const gameId = gameService.getGameCode();
				console.log("gameId in initNumer0nClient: ", gameId);
				if (gameId) {
					await numer0nClient.connect(gameId);
				}

				setNumer0nClient(numer0nClient);
			} catch (error) {
				console.error("Error connecting to numer0n client: ", error);
			}
		};
		initNumer0nClient();
	}, [numer0nContractService]);

	useEffect(() => {
		if (!numer0nContractService) {
			console.log("numer0nContractService not found");
			return;
		}

		if (!wallet) {
			console.log("wallet not found");
			return;
		}
	}, [numer0nContractService, wallet]);

	const updateStates = async () => {
		if (!numer0nContractService || !numer0nContractService.contractAddress) {
			console.log("numer0nContractService not found");
			return;
		}

		const game = await numer0nContractService.getGame();
		console.log("game: ", game);
		setIsFirst(game.is_first);
		setRound(Number(game.round));
		setStatus(Number(game.status));

		// TODO: update guess
		await loadHistry(true, false);
		await loadHistry(false, false);

		if (Number(game.status) == GAME_STATUS.FINISHED && gameService) {
			const playerId = gameService.getSelf().id;
			setGameResult(
				Number(game.winner_id) == playerId
					? "WIN"
					: Number(game.winner_id) == 3
					? "DRAW"
					: "LOSE"
			);
		}
	};

	useEffect(() => {
		const intervalId = setInterval(async () => {
			if (!gameService) {
				console.log("game not found");
				return;
			}

			await updateStates();
		}, 5000);
		return () => {
			clearInterval(intervalId);
		};
	}, [numer0nContractService, gameService]);

	useEffect(() => {
		const intervalId = setInterval(async () => {
			await loadHistry(false, false);
		}, 5000);
		return () => {
			clearInterval(intervalId);
		};
	}, []);

	useEffect(() => {
		const lenMinusRound = round - 1;
		if (round > 5 && resultRowsSelf.length == lenMinusRound) {
			resultRowsSelf.push(emptyRow);
		}
		if (round > 5 && resultRowsOpponent.length == lenMinusRound) {
			resultRowsOpponent.push(emptyRow);
		}
	}, [round, resultRowsSelf, resultRowsOpponent]);

	const setResultRows = (isSelf: boolean, resultRows: ResultRow[]) => {
		if (isSelf) {
			setResultRowsSelf(resultRows);
		} else {
			setResultRowsOpponent(resultRows);
		}
	};

	const loadHistry = async (isSelf: boolean, fromLocal: boolean) => {
		if (fromLocal) {
			const resultRows = await getHistryFromLocalStorage(isSelf);
			if (!resultRows) return;
			setResultRows(isSelf, resultRows);
		} else {
			let resultRows = await getHistry(isSelf);
			if (!resultRows) return;

			if (resultRows.length <= 5)
				resultRows = resultRows.concat(
					Array(5 - resultRows.length).fill(emptyRow)
				);

			setResultRows(isSelf, resultRows);
			setHistryToLocalStorage(isSelf, resultRows);
		}
	};

	const getHistryFromLocalStorage = async (
		isSelf: boolean
	): Promise<ResultRow[]> => {
		if (!gameService) {
			console.log("game not found");
			return [];
		}

		const history = gameService.getGuesses(isSelf).map((g: Guess) => ({
			guess: g.guess === 0 ? "" : g.guess.toString(),
			eat: g.eat === 0 && g.bite === 0 ? "" : g.eat.toString(),
			bite: g.eat === 0 && g.bite === 0 ? "" : g.bite.toString(),
		}));

		return history;
	};

	const setHistryToLocalStorage = async (
		isSelf: boolean,
		resultRows: ResultRow[]
	) => {
		if (!gameService) {
			console.log("game not found");
			return;
		}

		const guesses = resultRows.map((r) => ({
			guess: Number(r.guess),
			eat: Number(r.eat),
			bite: Number(r.bite),
		}));

		gameService.setGuesses(isSelf, guesses);
	};

	const getHistry = async (isSelf: boolean) => {
		if (!gameService) {
			console.log("game not found");
			return;
		}

		if (!numer0nContractService || !numer0nContractService.contractAddress) {
			console.log("numer0nContractService not found");
			return;
		}

		const self = gameService.getSelf().address;
		const opponent = gameService.getOpponent().address;
		if (!self || !opponent) {
			console.log("self or opponent not found");
			return;
		}
		console.log("self: ", self);
		console.log("opponent: ", opponent);

		const player = isSelf ? self : opponent;

		if (!player) {
			console.log("player not found");
			return;
		}

		console.log("player: ", player);

		const round = await numer0nContractService.getRound();
		setRound(Number(round));

		if (round == 0n) {
			console.log("round zero");
			return emptyRows;
		}

		let resultRow: ResultRow[] = [];

		const guesses = await numer0nContractService.getGuesses(player);

		console.log(
			"guesses: ",
			guesses.map((g) => g)
		);

		for (let i = 0; i < round; i++) {
			if (guesses[i].guess != 0) {
				const newResult: ResultRow = {
					guess: stringfyAndPaddZero(guesses[i].guess),
					eat: guesses[i].eat.toString(),
					bite: guesses[i].bite.toString(),
					// item: guess.item,
					// item_result: guess.item_result,
				};
				// console.log("newResult: ", newResult);

				resultRow.push(newResult);
			}
		}

		return resultRow;
	};

	const leaveGame = async () => {
		if (!gameService) {
			console.log("gameService not found");
			return;
		}
		await gameService.logout();
		setGameService(null);
	};

	return {
		gameService,
		numer0nContractService,
		numer0nClient,
		isFirst,
		round,
		status,
		resultRowsSelf,
		resultRowsOpponent,
		gameResult,
		contractAddress,
		setContractAddress,
		updateStates,
		loadHistry,
		setNumer0nService,
		setNumer0nClient,
		leaveGame,
	};
};

import { useEffect, useState } from "react";
import { stringfyAndPaddZero } from "src/scripts/utils";
import { Game, GAME_STATUS } from "src/services/game";
import type { AccountWallet } from "@aztec/aztec.js";
import { Numer0nContractService } from "src/services/numer0n";
import { Numer0nClient } from "src/services/numer0nClient";
import { useAccountContext } from "src/contexts/useAccountContext";

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
	// const { deployer, wallet, opponent } = useAccounts();
	const { deployer, wallet } = useAccountContext();
	const [gameData, setGameData] = useState<Game | null>(null);
	const [numer0nService, setNumer0nService] =
		useState<Numer0nContractService | null>(null);
	const [numer0nClient, setNumer0nClient] = useState<Numer0nClient | null>(
		null
	);

	console.log("wallet in useGame: ", wallet);
	console.log("numer0nService in useGame: ", numer0nService);
	console.log("numer0nClient in useGame: ", numer0nClient);

	const [resultRowsSelf, setResultRowsSelf] = useState<ResultRow[]>(emptyRows);
	const [resultRowsOpponent, setResultRowsOpponent] =
		useState<ResultRow[]>(emptyRows);

	// console.log("resultRowsSelf in useGuess: ", resultRowsSelf);
	// console.log("resultRowsOpponent in useGuess: ", resultRowsOpponent);

	const [isFirst, setIsFirst] = useState<boolean | null>(null);
	const [round, setRound] = useState(0);
	const [status, setStatus] = useState(0);
	const [gameResult, setGameResult] = useState<GameResult | null>(null);
	console.log("gameResult in useGame: ", gameResult);

	const [contractAddress, setContractAddress] = useState<string | null>(null);

	useEffect(() => {
		const gameInstance = new Game();
		setGameData(gameInstance);
	}, []);

	useEffect(() => {
		const initNumer0nService = async () => {
			if (!gameData) {
				console.log("game not found: ", gameData);
				return;
			}

			if (!wallet) {
				console.log("wallet not found: ", wallet);
				return;
			}

			const contractAddr = contractAddress ?? gameData.getContractAddress();
			console.log("contractAddr: ", contractAddr);

			const numer0nService = new Numer0nContractService(
				wallet,
				gameData,
				contractAddr
			);
			setNumer0nService(numer0nService);
		};

		initNumer0nService();
	}, [gameData, wallet, contractAddress]);

	useEffect(() => {
		const initNumer0nClient = async () => {
			if (!gameData) {
				console.log("gameData not found");
				return;
			}
			if (!numer0nService) {
				console.log("numer0nService not found");
				return;
			}
			try {
				const numer0nClient = new Numer0nClient(numer0nService);
				const port = gameData.getGamePort();
				if (port) {
					await numer0nClient.connect(port);
				}
				setNumer0nClient(numer0nClient);
			} catch (error) {
				console.error("Error connecting to numer0n client: ", error);
			}
		};
		initNumer0nClient();
	}, [numer0nService]);

	useEffect(() => {
		if (!numer0nService) {
			console.log("numer0nService not found");
			return;
		}

		if (!wallet) {
			console.log("wallet not found");
			return;
		}
	}, [numer0nService, wallet]);

	const updateStates = async () => {
		if (!numer0nService || !numer0nService.contractAddress) {
			console.log("numer0nService not found");
			return;
		}

		const game = await numer0nService.getGame();
		console.log("game: ", game);
		setIsFirst(game.is_first);
		setRound(Number(game.round));
		setStatus(Number(game.status));

		// TODO: update guess
		await loadHistry(true, false);
		await loadHistry(false, false);

		if (Number(game.status) == GAME_STATUS.FINISHED && gameData) {
			const playerId = gameData.getSelf().id;
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
			if (!gameData) {
				console.log("game not found");
				return;
			}

			await updateStates();
		}, 5000);
		return () => {
			clearInterval(intervalId);
		};
	}, [numer0nService, gameData]);

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
		if (!gameData) {
			console.log("game not found");
			return [];
		}

		const history = gameData.getGuesses(isSelf).map((g) => ({
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
		if (!gameData) {
			console.log("game not found");
			return;
		}

		const guesses = resultRows.map((r) => ({
			guess: Number(r.guess),
			eat: Number(r.eat),
			bite: Number(r.bite),
		}));

		gameData.setGuesses(isSelf, guesses);
	};

	const getHistry = async (isSelf: boolean) => {
		if (!gameData) {
			console.log("game not found");
			return;
		}

		if (!numer0nService || !numer0nService.contractAddress) {
			console.log("numer0nService not found");
			return;
		}

		// const self = gameData.getSelf().id == 1 ? player1 : player2;
		// // console.log("self: ", self?.getAddress());
		// const opponent = gameData.getOpponent().id == 1 ? player1 : player2;
		// // console.log("opponent: ", opponent?.getAddress());
		// const player = isSelf ? self : opponent;
		// // console.log("player: ", player?.getAddress());

		const self = gameData.getSelf().address;
		const opponent = gameData.getOpponent().address;
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

		const round = await numer0nService.getRound();
		setRound(Number(round));

		if (round == 0n) {
			console.log("round zero");
			return emptyRows;
		}

		let resultRow: ResultRow[] = [];

		const guesses = await numer0nService.getGuesses(player);

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

	return {
		gameData,
		numer0nService,
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
	};
};

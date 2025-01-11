import { useEffect, useState } from "react";
import { stringfyAndPaddZero, hasVal } from "src/scripts";
import { useAccountContext } from "src/contexts";
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
	const [round, setRound] = useState<number | null>(null);
	const [status, setStatus] = useState<number | null>(null);
	const [gameResult, setGameResult] = useState<GameResult | null>(null);

	const [contractAddress, setContractAddress] = useState<string | null>(null);

	useEffect(() => {
		setGameService(new GameService());
	}, []);

	useEffect(() => {
		const initNumer0nService = async () => {
			if (!hasVal(gameService, "gameService", "useGame")) return;
			if (!hasVal(wallet, "wallet", "useGame")) return;

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
			if (!hasVal(gameService, "gameService", "useGame")) return;
			if (!hasVal(numer0nContractService, "numer0nContractService", "useGame"))
				return;
			try {
				const gameId = gameService.getGameCode();
				if (gameId) {
					const numer0nClient = new Numer0nClient(
						gameId,
						numer0nContractService
					);
					setNumer0nClient(numer0nClient);
				}
			} catch (error) {
				console.error("Error connecting to numer0n client: ", error);
			}
		};
		initNumer0nClient();
	}, [gameService, numer0nContractService]);

	const updateStates = async () => {
		console.log("updateStates...");
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
			if (!hasVal(gameService, "gameService", "useGame")) return;
			await updateStates();
		}, 5000);
		return () => {
			clearInterval(intervalId);
		};
	}, [gameService]);

	useEffect(() => {
		const intervalId = setInterval(async () => {
			await loadHistry(false, false);
		}, 5000);
		return () => {
			clearInterval(intervalId);
		};
	}, []);

	useEffect(() => {
		if (round == null) return;
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
		console.log("loadHistry...");
		if (fromLocal) {
			const resultRows = await getHistryFromLocalStorage(isSelf);
			if (!hasVal(resultRows, "resultRows", "useGame")) return;
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
	): Promise<ResultRow[] | undefined> => {
		console.log("getHistryFromLocalStorage...");
		if (!hasVal(gameService, "gameService", "useGame")) return;

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
		console.log("setHistryToLocalStorage...");
		if (!hasVal(gameService, "gameService", "useGame")) return;

		const guesses = resultRows.map((r) => ({
			guess: Number(r.guess),
			eat: Number(r.eat),
			bite: Number(r.bite),
		}));

		gameService.setGuesses(isSelf, guesses);
	};

	const getHistry = async (
		isSelf: boolean
	): Promise<ResultRow[] | undefined> => {
		console.log("getHistry...");
		if (!hasVal(gameService, "gameService", "useGame")) return;

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
		console.log("player: ", player);
		if (!hasVal(player, "player", "useGame")) return;

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

				resultRow.push(newResult);
			}
		}

		return resultRow;
	};

	const leaveGame = async () => {
		console.log("leaveGame...");
		if (!hasVal(gameService, "gameService", "useGame")) return;
		await gameService.logout();
		setGameService(new GameService());
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

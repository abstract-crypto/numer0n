import { createContext, useContext, ReactNode } from "react";
import { useGame } from "src/hooks";

type GameContextProps = ReturnType<typeof useGame>;

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameContextProvider = ({ children }: { children: ReactNode }) => {
	const game = useGame();

	return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
};

export const useGameContext = (): GameContextProps => {
	const context = useContext(GameContext);
	if (!context) {
		throw new Error(
			"useGameContext must be used within an GameContextProvider"
		);
	}
	return context;
};

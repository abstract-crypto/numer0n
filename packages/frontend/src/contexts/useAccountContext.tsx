import { createContext, useContext, ReactNode } from "react";
import { useAccount } from "../hooks/useAccount";

type AccountContextProps = ReturnType<typeof useAccount>;

const AccountContext = createContext<AccountContextProps | undefined>(
	undefined
);

export const AccountContextProvider = ({
	children,
}: {
	children: ReactNode;
}) => {
	const accounts = useAccount();

	return (
		<AccountContext.Provider value={accounts}>
			{children}
		</AccountContext.Provider>
	);
};

export const useAccountContext = (): AccountContextProps => {
	const context = useContext(AccountContext);
	if (!context) {
		throw new Error(
			"useAccountContext must be used within an AccountContextProvider"
		);
	}
	return context;
};

import "@mantine/core/styles.css";
import { MantineProvider, AppShell } from "@mantine/core";
import { GameContextProvider } from "./contexts/useGameContext";
import Onboard from "./components/Onboard";
import Header from "./components/Header";
import Game from "./components/Game";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import InvitePage from "./components/InvitePage";
import { AccountContextProvider } from "./contexts/useAccountContext";

export default function App() {
	return (
		<MantineProvider>
			<AccountContextProvider>
				<GameContextProvider>
					<AppShell
						bg={"linear-gradient(rgba(255,0,255,0.01),rgba(180,0,255,0.5))"}
						withBorder
					>
						<AppShell.Main>
							<BrowserRouter>
								<Header />
								<Routes>
									<Route path="/" element={<Onboard />} />
									<Route path="/game" element={<Game />} />
									<Route path="/invite" element={<InvitePage />} />
								</Routes>
							</BrowserRouter>
						</AppShell.Main>
					</AppShell>
				</GameContextProvider>
			</AccountContextProvider>
		</MantineProvider>
	);
}

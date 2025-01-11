import { MantineProvider, AppShell } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Notifications } from "@mantine/notifications";
import { AccountContextProvider, GameContextProvider } from "src/contexts";
import { Onboard, Header, Game, InvitePage } from "src/components";

export default function App() {
	return (
		<MantineProvider>
			<Notifications />
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

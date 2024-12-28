import {
	Modal,
	Text,
	Button,
	Box,
	Group,
	Divider,
	Center,
	TextInput,
} from "@mantine/core";
import { useState } from "react";
import { usePXE } from "src/hooks/usePXE";

type SetPXEModalType = {
	isOpen: boolean;
	onClose: () => void;
};

function SetPXEModal(props: SetPXEModalType) {
	const { pxeURL, setPXEURL } = usePXE();
	const [input, setInput] = useState<string>("");
	const [error, setError] = useState<string | null>(null);

	const validateURL = (url: string): boolean => {
		try {
			new URL(url);
			return true;
		} catch (_) {
			return false;
		}
	};

	const handleSetPXEURL = (url: string) => {
		if (validateURL(url)) {
			if (pxeURL !== url) {
				setPXEURL(url);
				setError(null);
				setInput("");
				handleClose();
			} else {
				setError("Same URL");
			}
		} else {
			setError("Please enter a valid URL");
		}
	};

	const handleClose = () => {
		setInput("");
		setError(null);
		props.onClose();
	};

	return (
		<Modal
			size="md"
			opened={props.isOpen}
			onClose={handleClose}
			withCloseButton={false}
			centered
		>
			<Box
				style={{
					backgroundColor: "#white",
					color: "black",
					textAlign: "center",
				}}
			>
				<Text size="lg" mt={10} mb={20}>
					Set PXE URL
				</Text>
				<Text size="sm" mb={20}>
					Current PXE URL: {pxeURL}
				</Text>
				<Center>
					<TextInput
						type="url"
						autoFocus={true}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						size="md"
						mb={20}
						style={{ width: "350px", height: "40px" }} // Added style prop
					/>
				</Center>
				<Divider my="sm" />
				{error && <Text color="red">{error}</Text>}
				<Center mt={20} mb={10}>
					<Group>
						<Button color="gray" onClick={handleClose}>
							Close
						</Button>
						<Button variant="filled" onClick={() => handleSetPXEURL(input)}>
							Confirm
						</Button>
					</Group>
				</Center>
			</Box>
		</Modal>
	);
}

export default SetPXEModal;

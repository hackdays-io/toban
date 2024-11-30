import {
	Box,
	Button,
	Checkbox,
	ClientOnly,
	HStack,
	Heading,
	Progress,
	RadioGroup,
	Skeleton,
	VStack,
} from "@chakra-ui/react";
import {
	DialogActionTrigger,
	DialogBody,
	DialogCloseTrigger,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import type { MetaFunction } from "@remix-run/node";
import { ColorModeToggle } from "../components/color-mode-toggle";
import { CommonDialog } from "~/components/CommonDialog";

export const meta: MetaFunction = () => {
	return [
		{ title: "New Remix App" },
		{ name: "description", content: "Welcome to Remix!" },
	];
};

const dialogTriggerReactNode = <Button variant="outline">Open</Button>;

export default function Index() {
	return (
		<Box textAlign="center" fontSize="xl" pt="30vh">
			<VStack gap="8">
				<img alt="chakra logo" src="/static/logo.svg" width="80" height="80" />
				<Heading size="2xl" letterSpacing="tight">
					Welcome to Chakra UI v3 + Remix
				</Heading>

				<CommonDialog dialogTriggerReactNode={dialogTriggerReactNode}>
					<DialogHeader>
						<DialogTitle>Dialog Title</DialogTitle>
					</DialogHeader>
					<DialogBody>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
							eiusmod tempor incididunt ut labore et dolore magna aliqua.
						</p>
					</DialogBody>
					<DialogFooter>
						<DialogActionTrigger asChild>
							<Button variant="outline">Cancel</Button>
						</DialogActionTrigger>
						<Button>Save</Button>
					</DialogFooter>
					<DialogCloseTrigger />
				</CommonDialog>

				<HStack gap="10">
					<Checkbox.Root defaultChecked>
						<Checkbox.HiddenInput />
						<Checkbox.Control>
							<Checkbox.Indicator />
						</Checkbox.Control>
						<Checkbox.Label>Checkbox</Checkbox.Label>
					</Checkbox.Root>

					<RadioGroup.Root display="inline-flex" defaultValue="1">
						<RadioGroup.Item value="1" mr="2">
							<RadioGroup.ItemHiddenInput />
							<RadioGroup.ItemControl>
								<RadioGroup.ItemIndicator />
							</RadioGroup.ItemControl>
							<RadioGroup.ItemText lineHeight="1">Radio</RadioGroup.ItemText>
						</RadioGroup.Item>

						<RadioGroup.Item value="2">
							<RadioGroup.ItemHiddenInput />
							<RadioGroup.ItemControl>
								<RadioGroup.ItemIndicator />
							</RadioGroup.ItemControl>
							<RadioGroup.ItemText lineHeight="1">Radio</RadioGroup.ItemText>
						</RadioGroup.Item>
					</RadioGroup.Root>
				</HStack>

				<Progress.Root width="300px" value={65} striped animated>
					<Progress.Track>
						<Progress.Range />
					</Progress.Track>
				</Progress.Root>

				<HStack>
					<Button>Lets go</Button>
					<Button variant="outline">bun install @chakra-ui/react</Button>
				</HStack>
			</VStack>

			<Box pos="absolute" top="4" right="4">
				<ClientOnly fallback={<Skeleton w="10" h="10" rounded="md" />}>
					<ColorModeToggle />
				</ClientOnly>
			</Box>
		</Box>
	);
}

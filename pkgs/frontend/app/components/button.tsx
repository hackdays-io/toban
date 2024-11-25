import {
	Button as ChakraButton,
	ButtonProps as ChakraButtonProps,
} from "@chakra-ui/react";

interface ButtonProps extends Omit<ChakraButtonProps, "width"> {
	children: React.ReactNode;
	width?: "full" | number;
	size?: "sm" | "md" | "lg";
	backgroundColor?: string;
	color?: string;
}

export const Button = ({
	children,
	width = "full",
	size = "md",
	backgroundColor,
	color,
	...props
}: ButtonProps) => {
	return (
		<ChakraButton
			w={width === "full" ? "100%" : width}
			size={size}
			backgroundColor={backgroundColor}
			color={color}
			{...props}
		>
			{children}
		</ChakraButton>
	);
};

export default Button;

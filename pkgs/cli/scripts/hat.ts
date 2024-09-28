import { optimism } from "viem/chains";
import { hatsSubgraphClient } from "../src/modules/hatsProtocol";

/**
 * HatsProtocolの機能を試すためのスクリプト
 */
const main = async () => {
	/*
	// hatの情報を取得する。
	const hat = await hatsSubgraphClient.getHat({
		chainId: optimism.id,
		hatId: BigInt(
			4394471306745554286530723459184199799802854540874113314419888470622208
			// 12664760623049752223273549914669722706079586129193058213113992646181026529280
		),
		props: {
			maxSupply: true, // get the maximum amount of wearers for the hat
			wearers: {
				// get the hat's wearers
				props: {}, // for each wearer, include only its ID (address)
			},
			events: {
				// get the hat's events
				props: {
					transactionID: true, // for each event, include the transaction ID
				},
				filters: {
					first: 10, // fetch only the latest 10 events
				},
			},
		},
	});

	console.log(hat);
	*/

	// ツリー情報を全て取得する。
	const tree = await hatsSubgraphClient.getTree({
		chainId: optimism.id,
		treeId: 163,
		props: {
			hats: {
				props: {
					prettyId: true,
					status: true,
					createdAt: true,
					details: true,
					maxSupply: true,
					eligibility: true,
					imageUri: true,
					toggle: true,
					levelAtLocalTree: true,
					currentSupply: true,
				},
			},
		},
	});

	console.log(tree);
};

main().catch(console.error);

"use client";

import SplitCreatorJson from "@/contracts/SplitCreator.sol/SplitCreator.json";
import {useGetHats} from "@/hooks/useHatRead";
import useSplitCreatorWrite from "@/hooks/useSplitCreatorWrite";
import useSplitsRead from "@/hooks/useSplitsRead";
import {SPLIT_CREATOR_CONTRACT_ADDRESS} from "@/lib/constants";
import {createTypedSignData} from "@/lib/metaTransaction";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  Input,
  NumberInput,
  NumberInputField,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {ethers} from "ethers";
import {useParams} from "next/navigation";
import {useEffect, useState} from "react";
import {toast} from "react-toastify";
import {useAccount, useChainId, useSignTypedData} from "wagmi";

function SplitterCreation() {
  // 状態の追加：画面の表示状態を管理
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [splitName, setSplitName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState({
    food: {selected: true, multiplier: 1},
    cleaning: {selected: true, multiplier: 1},
    committee: {selected: false, multiplier: 1},
  });
  const [preview, setPreview] = useState({
    yu23ki14: 39,
    ox123xxx: 31,
    vitalik: 15,
    halsk: 15,
  });

  const {address} = useAccount();
  const chainId = useChainId();
  const {signTypedDataAsync} = useSignTypedData();

  const {hatId} = useParams();
  const {roleHats} = useGetHats(hatId.toString());

  const {getRelatedSplits, relatedSplits} = useSplitsRead();

  // MetaTransactionを送信するメソッド
  const sendMetaTx = async () => {
    let result: any;
    // @todo リョーマさんに引数を準備してもらう。
    const splitData = [
      {
        hatId:
          "13803493104969821108641795624824018123086259522856944229608942353776640",
        multiplierBottom: 1,
        multiplierTop: 1,
        wearers: [
          "0x777EE5eeEd30c3712bEE6C83260D786857d9C556",
          "0x60C7C2A24b5e86C38639Fd1586917a8FEF66a56d",
        ],
      },
    ];
    // [
    //   1,
    //   1,
    //   10,
    //   ["0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072"],
    // ];
    // create typed sign data
    const typedSignData: any = await createTypedSignData(
      address,
      chainId as any,
      SPLIT_CREATOR_CONTRACT_ADDRESS,
      SplitCreatorJson.abi,
      "create",
      [splitData]
    );
    // sign
    const signature = await signTypedDataAsync(typedSignData);
    // send meta transaction
    await fetch("/api/requestRelayer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        typedSignData: typedSignData,
        signature: signature,
      }),
    }).then(async (result) => {
      // APIリクエストのリザルトをJSONとして解析
      console.log("API response:", await result.json());
      result = await result.json();
    });
    return result;
  };

  const handleRoleChange = (role: any) => {
    setSelectedRoles({
      ...selectedRoles,
      [role]: {
        // @ts-ignore
        ...selectedRoles[role],
        // @ts-ignore
        selected: !selectedRoles[role].selected,
      },
    });
  };

  const handleMultiplierChange = (role: any, value: any) => {
    setSelectedRoles({
      ...selectedRoles,
      [role]: {
        // @ts-ignore
        ...selectedRoles[role],
        multiplier: value,
      },
    });
  };

  const handleConfirm = () => {
    setPreview({
      yu23ki14: selectedRoles.food.multiplier * 10,
      ox123xxx: selectedRoles.cleaning.multiplier * 10,
      vitalik: 15,
      halsk: 15,
    });
    // Confirmボタンを押したら、画面2に切り替える
    setIsConfirmed(true);
  };

  // const {writeAsync, isLoading} = useSplitCreatorWrite({
  //   functionName: "create",
  //   args: [
  //     [
  //       {
  //         hatId:
  //           "13803493104969821108641795624824018123086259522856944229608942353776640",
  //         multiplierBottom: 1,
  //         multiplierTop: 1,
  //         wearers: [
  //           "0x777EE5eeEd30c3712bEE6C83260D786857d9C556",
  //           "0x60C7C2A24b5e86C38639Fd1586917a8FEF66a56d",
  //         ],
  //       },
  //     ],
  //   ] as any,
  //   chainId: chainId,
  //   onErrorToastData: {title: "Failed to create split"},
  //   enabled: true,
  // });

  /**
   * splitを作成するメソッド
   */
  const handleCreate = async () => {
    try {
      // Spliteをガスレスで作成する。
      const result = await sendMetaTx();
      // const result = await writeAsync();
      // @ts-ignore
      const rpcUrl = RPC_URLS[chainId];

      // // provider
      // const provider = new ethers.JsonRpcProvider(rpcUrl);
      // const txData = await provider.getTransactionReceipt(result.txHash);
      // console.log("txData:", txData);

      // ENSのサブドメインとsplitのアドレスを紐づける。
      // await fetch("/api/setAddr", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     txData: txData,
      //     addr: address, // splitのアドレスを渡す。
      //   }),
      // }).then(async (result) => {
      //   // APIリクエストのリザルトをJSONとして解析
      //   console.log("API response:", await result.json());
      // });

      toast.success("🦄 Success!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    } catch (err: any) {
      console.error("error:", err);
      toast.error("Failed....", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      await getRelatedSplits("0xdCb93093424447bF4FE9Df869750950922F1E30B");
      console.log("relatedSplits", relatedSplits);
    };
    init();
  }, []);

  return (
    <Box p={6} maxW="600px" mx="auto">
      {isConfirmed ? (
        // 画面2: スプリット分配率のプレビューとCreateボタン
        <VStack spacing={6} align="stretch">
          <Heading size="md" mb={4}>
            2024 Q3 Rewards
          </Heading>
          <Stack spacing={2}>
            <Text>yu23ki14.eth: {preview.yu23ki14}%</Text>
            <Text>0x123...xxx: {preview.ox123xxx}%</Text>
            <Text>vitalik.eth: {preview.vitalik}%</Text>
            <Text>halsk.eth: {preview.halsk}%</Text>
          </Stack>
          <Button colorScheme="blue" onClick={handleCreate}>
            Create
          </Button>
        </VStack>
      ) : (
        // 画面1: Splitの名前、ロールのチェックボックス選択、Role Multiplierの入力、Confirmボタン
        <VStack spacing={6} align="stretch">
          <FormControl id="split-name">
            <FormLabel>Split Name</FormLabel>
            <Input
              value={splitName}
              onChange={(e) => setSplitName(e.target.value)}
              placeholder="Split name input"
            />
          </FormControl>

          {roleHats?.map((roleHat) => (
            <Box>
              <FormControl id="food-role">
                <Checkbox
                  isChecked={selectedRoles.food.selected}
                  onChange={() => handleRoleChange(roleHat.id)}
                >
                  {roleHat.parsedData.parsedData.data?.name}
                </Checkbox>
                <NumberInput
                  value={selectedRoles.food.multiplier}
                  onChange={(valueString) =>
                    handleMultiplierChange("food", parseInt(valueString))
                  }
                  min={1}
                  mt={2}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </Box>
          ))}

          <Box>
            <FormControl id="cleaning-role">
              <Checkbox
                isChecked={selectedRoles.cleaning.selected}
                onChange={() => handleRoleChange("cleaning")}
              >
                Cleaning
              </Checkbox>
              <NumberInput
                value={selectedRoles.cleaning.multiplier}
                onChange={(valueString) =>
                  handleMultiplierChange("cleaning", parseInt(valueString))
                }
                min={1}
                mt={2}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </Box>

          <Box>
            <FormControl id="committee-role">
              <Checkbox
                isChecked={selectedRoles.committee.selected}
                onChange={() => handleRoleChange("committee")}
              >
                Committee
              </Checkbox>
              <NumberInput
                value={selectedRoles.committee.multiplier}
                onChange={(valueString) =>
                  handleMultiplierChange("committee", parseInt(valueString))
                }
                min={1}
                mt={2}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </Box>

          <Button colorScheme="blue" onClick={handleConfirm}>
            Confirm
          </Button>
        </VStack>
      )}
    </Box>
  );
}

export default SplitterCreation;

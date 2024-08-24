"use client";

import SplitCreatorJson from "@/contracts/SplitCreator.sol/SplitCreator.json";
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
import {useState} from "react";
import {toast} from "react-toastify";
import {useAccount, useChainId, useSignTypedData} from "wagmi";

function SplitterCreation() {
  // 状態の追加：画面の表示状態を管理
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [splitName, setSplitName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState({
    food: {selected: true, multiplier: 2},
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

  // MetaTransactionを送信するメソッド
  const sendMetaTx = async () => {
    const splitData = [
      1,
      1,
      10,
      ["0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072"],
    ];
    // create typed sign data
    const typedSignData: any = await createTypedSignData(
      address,
      chainId as any,
      SPLIT_CREATOR_CONTRACT_ADDRESS,
      SplitCreatorJson.abi,
      "create",
      [splitData] //今は仮のデータ
    );
    // sign
    const signature = await signTypedDataAsync(typedSignData);
    console.log("signature", signature);
    // send meta transaction
    await fetch("api/requestRelayer", {
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
    });
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

  /**
   * splitを作成するメソッド
   */
  const handleCreate = async () => {
    try {
      // Spliteをガスレスで作成する。
      await sendMetaTx();
      // @todo ここにENSとの紐付けロジックを入れる。

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

          <Box>
            <FormControl id="food-role">
              <Checkbox
                isChecked={selectedRoles.food.selected}
                onChange={() => handleRoleChange("food")}
              >
                Food
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

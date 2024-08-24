"use client";

import TimeFrameHatModuleJson from "@/contracts/timeframe/TimeFrameHatModule.sol/TimeFrameHatModule.json";
import { TIME_FRAME_MODULE_CONTRACT_ADDRESS } from '@/lib/constants';
import { createTypedSignData } from '@/lib/metaTransaction';
import { wagmiConfig } from "@/lib/web3";
import { Box, Button, FormControl, FormLabel, Input, InputGroup, InputRightElement, Textarea } from '@chakra-ui/react';
import { getEnsResolver } from '@wagmi/core';
import { useState } from 'react';
import { FaCalendarAlt, FaQrcode } from 'react-icons/fa';
import { zeroAddress } from "viem";
import { normalize } from 'viem/ens';
import { useAccount, useChainId, useSignTypedData } from 'wagmi';

export default function NewRoleGrantedComponent() {
  const [address, setAddress] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [workScope, setWorkScope] = useState("");
  const [initialUnits, setInitialUnits] = useState(100);
  const [startDate, setStartDate] = useState("");

  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();

  /**
   * MetaTransactionを送信するメソッド
   */
  const sendMetaTx = async () => {
    console.log('sendMetaTransaction');
    // create typed sign data
    const typedSignData: any = await createTypedSignData(
      connectedAddress, 
      chainId as any, 
      TIME_FRAME_MODULE_CONTRACT_ADDRESS, 
      TimeFrameHatModuleJson.abi,           
      'mintHat', 
      [0x033 , address] // rolehatIdはルーターで受け取れるようにする。
    );
    // sign
    const signature = await signTypedDataAsync(typedSignData);
    console.log('signature', signature);
    // send meta transaction
    await fetch("api/requestRelayer", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        typedSignData: typedSignData,
        signature: signature,
      })
    }).then(async result => {
      // APIリクエストのリザルトをJSONとして解析
      console.log("API response:", await result.json());
    });
  };

  const handleAddressClick = async(e:any) => {
    const ensResolver = await getEnsResolver(wagmiConfig, {
      name: normalize(e.target.value),
    })
    console.log("ensResolver", ensResolver);

    if(ensResolver == zeroAddress) {
      console.error("resolve error", ensResolver);
    } else {
      setAddress(ensResolver)
    }
  };

  const handleRoleNameChange = (e:any) => setRoleName(e.target.value);
  const handleRoleDescriptionChange = (e:any) => setRoleDescription(e.target.value);
  const handleWorkScopeChange = (e:any) => setWorkScope(e.target.value);
  const handleInitialUnitsChange = (e:any) => setInitialUnits(e.target.value);
  const handleStartDateChange = (e:any) => setStartDate(e.target.value);

  return (
    <Box maxWidth="400px" mx="auto" mt="10" p="5" borderWidth="1px" borderRadius="lg">
      <FormControl mb="4">
        <FormLabel>Address to be granted</FormLabel>
        <InputGroup>
          <Input
            value={address}
            onChange={(e:any) => setAddress(e.target.value)}
            placeholder="vitalik.eth"
          />
          <InputRightElement width="4.5rem">
            <Button size="sm" onClick={() => console.log("QR code button was clicked")}>
              <FaQrcode />
            </Button>
          </InputRightElement>
        </InputGroup>
        <Button colorScheme="green" width="full" onClick={handleAddressClick}>
          Resolve
        </Button>
      </FormControl>

      <FormControl mb="4">
        <FormLabel>Role Name</FormLabel>
        <Input
          value={roleName}
          onChange={handleRoleNameChange}
          placeholder="Food"
        />
      </FormControl>

      <FormControl mb="4">
        <FormLabel>Role Description</FormLabel>
        <Textarea
          value={roleDescription}
          onChange={handleRoleDescriptionChange}
          placeholder="Enter a description of the role"
        />
      </FormControl>

      <FormControl mb="4">
        <FormLabel>Work Scope</FormLabel>
        <Textarea
          value={workScope}
          onChange={handleWorkScopeChange}
          placeholder="Examples: cleaning public spaces, planning cleaning challenges, cleaning responsibilities"
        />
      </FormControl>

      <FormControl mb="4">
        <FormLabel>Number of Initial Units</FormLabel>
        <InputGroup>
          <Input
            value={initialUnits}
            onChange={handleInitialUnitsChange}
            type="number"
            min="0"
            max="100"
          />
          <InputRightElement>%</InputRightElement>
        </InputGroup>
      </FormControl>

      <FormControl mb="4">
        <FormLabel>Starting Date</FormLabel>
        <InputGroup>
          <Input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
          />
          <InputRightElement>
            <FaCalendarAlt />
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <Button colorScheme="blue" width="full" onClick={sendMetaTx}>
        Submit
      </Button>
    </Box>
  );
}

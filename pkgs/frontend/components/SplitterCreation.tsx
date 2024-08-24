"use client";

import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Stack,
  Text,
  VStack,
  Heading,
} from '@chakra-ui/react';

function SplitterCreation() {
  // ここに先ほどのコードを貼り付け
  const [splitName, setSplitName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState({
    food: { selected: true, multiplier: 2 },
    cleaning: { selected: true, multiplier: 1 },
    committee: { selected: false, multiplier: 1 },
  });
  const [preview, setPreview] = useState({
    yu23ki14: 39,
    ox123xxx: 31,
    vitalik: 15,
    halsk: 15,
  });

  const handleRoleChange = (role) => {
    setSelectedRoles({
      ...selectedRoles,
      [role]: {
        ...selectedRoles[role],
        selected: !selectedRoles[role].selected,
      },
    });
  };

  const handleMultiplierChange = (role, value) => {
    setSelectedRoles({
      ...selectedRoles,
      [role]: {
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
  };

  const handleCreate = () => {
    // スプリットを作成し、選択したチェーンにデプロイするロジック
  };

  return (
    <Box p={6} maxW="600px" mx="auto">
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
              onChange={() => handleRoleChange('food')}
            >
              Food
            </Checkbox>
            <NumberInput
              value={selectedRoles.food.multiplier}
              onChange={(valueString) => handleMultiplierChange('food', parseInt(valueString))}
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
              onChange={() => handleRoleChange('cleaning')}
            >
              Cleaning
            </Checkbox>
            <NumberInput
              value={selectedRoles.cleaning.multiplier}
              onChange={(valueString) => handleMultiplierChange('cleaning', parseInt(valueString))}
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
              onChange={() => handleRoleChange('committee')}
            >
              Committee
            </Checkbox>
            <NumberInput
              value={selectedRoles.committee.multiplier}
              onChange={(valueString) => handleMultiplierChange('committee', parseInt(valueString))}
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

        <Box p={4} bg="gray.100" borderRadius="md">
          <Heading size="md" mb={4}>
            2024 Q3 Rewards
          </Heading>
          <Stack spacing={2}>
            <Text>yu23ki14.eth: {preview.yu23ki14}%</Text>
            <Text>0x123...xxx: {preview.ox123xxx}%</Text>
            <Text>vitalik.eth: {preview.vitalik}%</Text>
            <Text>halsk.eth: {preview.halsk}%</Text>
          </Stack>
        </Box>

        <Button colorScheme="blue" onClick={handleCreate}>
          Create
        </Button>
      </VStack>
    </Box>
  );
}

export default SplitterCreation;
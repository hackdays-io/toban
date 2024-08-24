"use client";

import { Box, Button, Input, Select, Text } from '@chakra-ui/react';
import { useState } from 'react';

export default function SendToken() {
  const [selectedRecipient, setSelectedRecipient] = useState('vitalik.eth');
  const [percentage, setPercentage] = useState(10);
  const [yourShare, setYourShare] = useState(65);
  const [recipientShare, setRecipientShare] = useState(10);

  const handlePercentageChange = (e:any) => {
    const newPercentage = parseFloat(e.target.value);
    setPercentage(newPercentage);

    const newYourShare = yourShare - newPercentage;
    const newRecipientShare = recipientShare + newPercentage;

    setYourShare(newYourShare);
    setRecipientShare(newRecipientShare);
  };

  const handleSubmit = () => {
    // トークン送信のロジックをここに追加
    alert(`Sent ${percentage}% to ${selectedRecipient}`);
  };

  return (
    <Box p={5} maxW="400px" mx="auto" mt="50px">
      <Select
        value={selectedRecipient}
        onChange={(e) => setSelectedRecipient(e.target.value)}
        mb={3}
      >
        <option value="vitalik.eth">vitalik.eth</option>
        {/* ここに他のオプションを追加できます */}
      </Select>

      <Text fontSize="2xl" mb={3}>Share role units</Text>

      <Text fontSize="4xl" mb={3}>{percentage} %</Text>

      <Input
        type="number"
        value={percentage}
        onChange={handlePercentageChange}
        mb={3}
      />

      <Box mb={5}>
        <Text>Your Share: {yourShare}%</Text>
        <Text>{selectedRecipient}'s Share: {recipientShare}%</Text>
      </Box>


      <Button colorScheme="blue" onClick={handleSubmit} w="full">
        Submit
      </Button>
    </Box>
  );
}

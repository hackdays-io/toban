"use client";

import { Box, Button, FormControl, FormLabel, Input, InputGroup, InputRightElement, Textarea } from '@chakra-ui/react';
import { useState } from 'react';
import { FaCalendarAlt, FaQrcode } from 'react-icons/fa';

export default function NewRoleGrantedComponent() {
  const [address, setAddress] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [workScope, setWorkScope] = useState("");
  const [initialUnits, setInitialUnits] = useState(100);
  const [startDate, setStartDate] = useState("");

  const handleAddressChange = (e:any) => setAddress(e.target.value);
  const handleRoleNameChange = (e:any) => setRoleName(e.target.value);
  const handleRoleDescriptionChange = (e:any) => setRoleDescription(e.target.value);
  const handleWorkScopeChange = (e:any) => setWorkScope(e.target.value);
  const handleInitialUnitsChange = (e:any) => setInitialUnits(e.target.value);
  const handleStartDateChange = (e:any) => setStartDate(e.target.value);

  const handleSubmit = () => {
    console.log("The form was submitted with the following data:");
    console.log({
      address,
      roleName,
      roleDescription,
      workScope,
      initialUnits,
      startDate,
    });
  };

  return (
    <Box maxWidth="400px" mx="auto" mt="10" p="5" borderWidth="1px" borderRadius="lg">
      <FormControl mb="4">
        <FormLabel>Address to be granted</FormLabel>
        <InputGroup>
          <Input
            value={address}
            onChange={handleAddressChange}
            placeholder="vitalik.eth"
          />
          <InputRightElement width="4.5rem">
            <Button size="sm" onClick={() => console.log("QR code button was clicked")}>
              <FaQrcode />
            </Button>
          </InputRightElement>
        </InputGroup>
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

      <Button colorScheme="blue" width="full" onClick={handleSubmit}>
        Submit
      </Button>
    </Box>
  );
}

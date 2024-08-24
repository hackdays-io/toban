"use client";

import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, InputGroup, IconButton, Textarea, VStack, HStack } from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';

export default function CreateRoleComponent() {
  const [responsibilities, setResponsibilities] = useState([{ name: '', description: '', link: '' }]);

  const handleAddResponsibility = () => {
    setResponsibilities([...responsibilities, { name: '', description: '', link: '' }]);
  };

  const handleRemoveResponsibility = (index) => {
    const updatedResponsibilities = responsibilities.filter((_, i) => i !== index);
    setResponsibilities(updatedResponsibilities);
  };

  const handleResponsibilityChange = (index, field, value) => {
    const updatedResponsibilities = responsibilities.map((resp, i) => 
      i === index ? { ...resp, [field]: value } : resp
    );
    setResponsibilities(updatedResponsibilities);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      responsibilities,
    });
  };

  return (
    <Box maxW="800px" mx="auto" mt="10">
      <form onSubmit={handleSubmit}>
        <VStack spacing="5">
          <FormControl id="image">
            <FormLabel>Image</FormLabel>
            <Input type="file" />
          </FormControl>
          <FormControl id="name" isRequired>
            <FormLabel>Name</FormLabel>
            <Input type="text" placeholder="Enter role name" />
          </FormControl>
          <FormControl id="description">
            <FormLabel>Description</FormLabel>
            <Textarea placeholder="Enter role description" />
          </FormControl>

          {responsibilities.map((resp, index) => (
            <Box key={index} p="4" borderWidth="1px" borderRadius="lg" width="100%">
              <HStack justify="space-between" mb="2">
                <FormLabel>Responsibility {index + 1}</FormLabel>
                <IconButton
                  icon={<DeleteIcon />}
                  aria-label="Delete responsibility"
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleRemoveResponsibility(index)}
                />
              </HStack>
              <VStack spacing="3">
                <FormControl id={`responsibility-name-${index}`} isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    type="text"
                    value={resp.name}
                    onChange={(e) => handleResponsibilityChange(index, 'name', e.target.value)}
                    placeholder="Enter responsibility name"
                  />
                </FormControl>
                <FormControl id={`responsibility-description-${index}`}>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={resp.description}
                    onChange={(e) => handleResponsibilityChange(index, 'description', e.target.value)}
                    placeholder="Enter responsibility description"
                  />
                </FormControl>
                <FormControl id={`responsibility-link-${index}`}>
                  <FormLabel>Link</FormLabel>
                  <Input
                    type="url"
                    value={resp.link}
                    onChange={(e) => handleResponsibilityChange(index, 'link', e.target.value)}
                    placeholder="Enter responsibility link"
                  />
                </FormControl>
              </VStack>
            </Box>
          ))}

          <Button onClick={handleAddResponsibility} leftIcon={<AddIcon />} colorScheme="blue" variant="outline">
            Add Responsibility
          </Button>
          <Button type="submit" colorScheme="teal" width="full">
            Create Role
          </Button>
        </VStack>
      </form>
    </Box>
  );
}

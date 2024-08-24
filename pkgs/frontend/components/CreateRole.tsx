"use client";

import {uploadFileToIpfs} from "@/lib/ipfs";
import {AddIcon, DeleteIcon} from "@chakra-ui/icons";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {toast} from "react-toastify";
import Toaster from "./Toaster";
import {useEffect, useState} from "react";

export default function CreateRoleComponent() {
  const [responsibilities, setResponsibilities] = useState([
    {name: "", description: "", link: ""},
  ]);
  const [file, setFile] = useState<any>();

  const handleAddResponsibility = () => {
    setResponsibilities([
      ...responsibilities,
      {name: "", description: "", link: ""},
    ]);
  };

  const handleRemoveResponsibility = (index: any) => {
    const updatedResponsibilities = responsibilities.filter(
      (_, i) => i !== index
    );
    setResponsibilities(updatedResponsibilities);
  };

  const handleResponsibilityChange = (index: any, field: any, value: any) => {
    const updatedResponsibilities = responsibilities.map((resp, i) =>
      i === index ? {...resp, [field]: value} : resp
    );
    setResponsibilities(updatedResponsibilities);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log({
      responsibilities,
    });
  };

  /**
   * ファイルが選択されたときにステートを更新するメソッド
   */
  const handleFileChange = (event: any) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  useEffect(() => {
    const uploadToIpfs = async () => {
      try {
        // IPFSにファイルを呼び出すためのメソッドを呼び出す。
        const url = await uploadFileToIpfs(file);
        console.log("content url:", url);

        toast.success("🦄 file upload Success!", {
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
        toast.error("file upload Failed....", {
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
    uploadToIpfs();
  }, [file]);

  return (
    <Box maxW="800px" mx="auto" mt="10">
      <form onSubmit={handleSubmit}>
        <VStack spacing="5">
          <FormControl id="image">
            <FormLabel>Image</FormLabel>
            <Input type="file" onChange={handleFileChange} />
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
            <Box
              key={index}
              p="4"
              borderWidth="1px"
              borderRadius="lg"
              width="100%"
            >
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
                    onChange={(e) =>
                      handleResponsibilityChange(index, "name", e.target.value)
                    }
                    placeholder="Enter Responsibility Name"
                  />
                </FormControl>
                <FormControl id={`responsibility-description-${index}`}>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={resp.description}
                    onChange={(e) =>
                      handleResponsibilityChange(
                        index,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Enter Responsibility Description"
                  />
                </FormControl>
                <FormControl id={`responsibility-link-${index}`}>
                  <FormLabel>Link</FormLabel>
                  <Input
                    type="url"
                    value={resp.link}
                    onChange={(e) =>
                      handleResponsibilityChange(index, "link", e.target.value)
                    }
                    placeholder="Enter Responsibility Link"
                  />
                </FormControl>
              </VStack>
            </Box>
          ))}

          <Button
            onClick={handleAddResponsibility}
            leftIcon={<AddIcon />}
            colorScheme="blue"
            variant="outline"
          >
            Add Responsibility
          </Button>
          <Button type="submit" colorScheme="teal" width="full">
            Create Role
          </Button>
        </VStack>
      </form>
      <Toaster />
    </Box>
  );
}

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
import {useEffect, useState} from "react";
import {Controller, useForm} from "react-hook-form";
import {useUploadHatDetail} from "@/hooks/useHatDetail";
import {HatsResponsibility} from "@/types/hats";
import {useHatCreate} from "@/hooks/useHatCreate";
import {useParams} from "next/navigation";
import {useGetHats} from "@/hooks/useHatRead";

type FormData = {
  name: string;
  description: string;
};

export default function CreateRoleComponent() {
  const [responsibilities, setResponsibilities] = useState<
    HatsResponsibility[]
  >([]);
  const [file, setFile] = useState<any>();
  const [detailsURI, setDetailsURI] = useState<string>("");
  const [imageURI, setImageURI] = useState<string | null>(null);

  const {hatId} = useParams();
  const {hatterHatId} = useGetHats(hatId.toString());

  const {uploadHatDetail} = useUploadHatDetail();

  const {control, handleSubmit} = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleAddResponsibility = () => {
    setResponsibilities([
      ...responsibilities,
      {label: "", description: "", link: ""},
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

  const submit = async (data: FormData) => {
    const {ipfs} = await uploadHatDetail(
      data.name,
      data.description,
      responsibilities
    );
    setDetailsURI(ipfs);
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
      if (!file) return;

      try {
        // IPFSにファイルを呼び出すためのメソッドを呼び出す。
        const {cid} = await uploadFileToIpfs(file);
        setImageURI(`ipfs://${cid}`);

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

  const {writeAsync} = useHatCreate({
    hatId: hatterHatId,
    imageURI: imageURI!,
    detailsURI,
  });

  useEffect(() => {
    const fetch = async () => {
      if (imageURI && detailsURI) {
        await writeAsync();
      }
    };
    fetch();
  }, [imageURI, detailsURI]);

  return (
    <Box maxW="800px" mx="auto" mt="10">
      <form onSubmit={handleSubmit(submit)}>
        <VStack spacing="5">
          <FormControl id="image">
            <FormLabel>Image</FormLabel>
            <Input type="file" onChange={handleFileChange} />
          </FormControl>
          <FormControl id="name" isRequired>
            <FormLabel>Name</FormLabel>
            <Controller
              control={control}
              name="name"
              render={({field}) => (
                <Input {...field} type="text" placeholder="Enter role name" />
              )}
            />
          </FormControl>
          <FormControl id="description">
            <FormLabel>Description</FormLabel>
            <Controller
              control={control}
              name="description"
              render={({field}) => (
                <Textarea {...field} placeholder="Enter role description" />
              )}
            />
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
                    value={resp.label}
                    onChange={(e) =>
                      handleResponsibilityChange(index, "label", e.target.value)
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
    </Box>
  );
}

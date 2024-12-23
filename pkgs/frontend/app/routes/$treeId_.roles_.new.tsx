import { FC, useState } from "react";
import { useParams } from "@remix-run/react";
import { Box, Button, Float, Text } from "@chakra-ui/react";
import { InputImage } from "~/components/InputImage";
import { useUploadImageFileToIpfs } from "hooks/useIpfs";
import { ContentContainer } from "~/components/ContentContainer";
import { InputName } from "~/components/InputName";
import { InputDescription } from "~/components/InputDescription";
import { CommonInput } from "~/components/common/CommonInput";
import { BasicButton } from "~/components/BasicButton";

const SectionHeading: FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text mt={7}>{children}</Text>
);

const PlusButton: FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <Button width="full" bg="blue.500" mt={4} color="gray.50" onClick={onClick}>
      +
    </Button>
  );
};

const DynamicInputList: FC<{
  items: string[];
  itemsCount: number;
  updateArrValueAtIndex: (
    index: number,
    value: string,
    arr: string[],
    setArr: (value: string[]) => void
  ) => void;
  setItems: (value: string[]) => void;
  itemLabel: string;
}> = ({ items, itemsCount, updateArrValueAtIndex, setItems, itemLabel }) => {
  return (
    <Box w="100%" mt={2}>
      {[...Array(itemsCount)].map((_, index) => (
        <CommonInput
          key={index}
          minHeight="45px"
          mt={2}
          value={items[index]}
          onChange={(e) =>
            updateArrValueAtIndex(index, e.target.value, items, setItems)
          }
        />
      ))}
    </Box>
  );
};

const handleSubmit = () => {
  console.log("submit");
};

const NewRole: FC = () => {
  const { treeId, hatId, address } = useParams();

  const { uploadImageFileToIpfs, imageFile, setImageFile } =
    useUploadImageFileToIpfs();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [responsibilitiesCount, setResponsibilitiesCount] = useState<number>(0);

  const [authorities, setAuthorities] = useState<string[]>([]);
  const [authoritiesCount, setAuthoritiesCount] = useState<number>(0);

  const updateArrValueAtIndex = (
    index: number,
    newValue: string,
    arr: string[],
    setArr: (value: string[]) => void
  ) => {
    const newArr = [...arr];
    newArr[index] = newValue;
    setArr(newArr);
  };

  return (
    <>
      <Box mt={5} w="100%">
        <Text fontSize="lg">新しいロールを作成</Text>
        <ContentContainer>
          <InputImage imageFile={imageFile} setImageFile={setImageFile} />
          <InputName name={name} setName={setName} />
          <InputDescription
            description={description}
            setDescription={setDescription}
          />
        </ContentContainer>
        <SectionHeading>Responsibilities</SectionHeading>
        <ContentContainer>
          <DynamicInputList
            items={responsibilities}
            itemsCount={responsibilitiesCount}
            updateArrValueAtIndex={updateArrValueAtIndex}
            setItems={setResponsibilities}
            itemLabel="Responsibility"
          />
          <PlusButton
            onClick={() => setResponsibilitiesCount(responsibilitiesCount + 1)}
          />
        </ContentContainer>
        <SectionHeading>Authorities</SectionHeading>
        <ContentContainer>
          <DynamicInputList
            items={authorities}
            itemsCount={authoritiesCount}
            updateArrValueAtIndex={updateArrValueAtIndex}
            setItems={setAuthorities}
            itemLabel="Authority"
          />
          <PlusButton
            onClick={() => setAuthoritiesCount(authoritiesCount + 1)}
          />
        </ContentContainer>
        <Box
          mt={10}
          mb="4vh"
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <BasicButton
            onClick={handleSubmit}
            disabled={!name || !description || !imageFile}
            // loading={isLoading}
          >
            作成
          </BasicButton>
        </Box>
      </Box>
    </>
  );
};

export default NewRole;

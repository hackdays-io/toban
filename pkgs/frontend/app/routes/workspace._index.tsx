import { FC, useEffect, useMemo, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { WorkspaceIcon } from "~/components/icon/WorkspaceIcon";
import { BasicButton } from "~/components/BasicButton";
import { useNavigate } from "@remix-run/react";
import { useActiveWallet } from "hooks/useWallet";
import { useHats } from "../../hooks/useHats";
// import { Tree } from "@hatsprotocol/sdk-v1-subgraph";

const WorkspaceCard: FC<{ name: string; imageUrl: string }> = ({
  name,
  imageUrl,
}) => {
  console.log("WorkspaceCard render");

  return (
    <Box
      // bg="red"
      w="100%"
      borderRadius="xl"
      border="1px solid #E0E0E0"
      mb={3}
      p={3}
      display="flex"
      alignItems="center"
    >
      <WorkspaceIcon workspaceImageUrl={imageUrl} size={10} />
      <Text ml={4}>{name}</Text>
    </Box>
  );
};

const Workspace: FC = () => {
  const [treesInfo, setTreesInfo] = useState<any>();
  const [workspacesList, setWorkspacesList] = useState<
    {
      name: string;
      imageUrl: string;
    }[]
  >([]);
  const navigate = useNavigate();

  console.log("Workspace render");
  const { wallet } = useActiveWallet();
  const { getWearerInfo, getTreesInfoByWearer } = useHats();

  const preferredAddress = wallet?.account?.address;

  console.log("preferredAddress", preferredAddress);

  const address = useMemo(() => {
    if (preferredAddress) {
      return preferredAddress as `0x${string}`;
    }
  }, [preferredAddress]);

  console.log("address", address);

  useEffect(() => {
    const fetchWearerInfo = async () => {
      const wearer = await getWearerInfo({
        walletAddress: address as `0x${string}`,
      });
      console.log("wearer", wearer);
    };
    fetchWearerInfo();
  }, [address, getWearerInfo]);

  useEffect(() => {
    const fetchTreesInfo = async () => {
      const _treesInfo = await getTreesInfoByWearer({
        walletAddress: address as `0x${string}`,
      });
      console.log("treesInfo in workspace", _treesInfo);
      // setTreesInfo(_treesInfo);
      // const _workspacesList = await Promise.all(
      //   treesInfo.map(async (tree: Tree | null | undefined) => {
      //     return {
      //       name: "workspace",
      //       imageUrl: tree?.hats?.[0]?.imageUri,
      //     };
      //   })
      // );
      // console.log("workspacesList", _workspacesList);

      // const _workspacesList = [
      //   {
      //     name: "Workspace 1",
      //     imageUrl: "https://example.com/image1.jpg",
      //   },
      //   {
      //     name: "Workspace 2",
      //     imageUrl: "https://example.com/image2.jpg",
      //   },
      // ];
      // setWorkspacesList(_workspacesList);
    };

    fetchTreesInfo();
  }, [address, getTreesInfoByWearer]);

  return (
    <>
      {/* <Box mt={5}>
        {workspacesList.map((workspace) => (
          <WorkspaceCard key={workspace.name} {...workspace} />
        ))}
      </Box>
      <>{JSON.stringify(treesInfo)}</>
      <BasicButton mt={7} onClick={() => navigate("/workspace/new")}>
        新しいワークスペースを作成
      </BasicButton> */}
    </>
  );
};

export default Workspace;

import { Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import { useNamesByAddresses } from "hooks/useENS";
import { useTreeInfo } from "hooks/useHats";
import { TextRecords } from "namestone-sdk";
import { FC, useMemo } from "react";
import { ipfs2https } from "utils/ipfs";
import { HorizontalRole } from "~/components/BasicRole";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { UserIcon } from "~/components/icon/UserIcon";

const WorkspaceMember: FC = () => {
  const { treeId } = useParams();
  const tree = useTreeInfo(Number(treeId));

  // 重複のないようにwearerを取得し、持っているhatを取得
  const wearers = useMemo(() => {
    if (!tree || !tree.hats) return [];
    return tree.hats
      .filter((h) => h.levelAtLocalTree && h.levelAtLocalTree >= 2)
      .flatMap((h) => h.wearers)
      .filter((w) => !!w)
      .filter((w, i, self) => self.findIndex((s) => s.id === w.id) === i)
      .map((w) => ({
        ...w,
        hats: tree.hats?.filter(
          (h) =>
            h.levelAtLocalTree &&
            h.levelAtLocalTree >= 2 &&
            h.wearers?.some(({ id }) => id === w.id)
        ),
      }));
  }, [tree]);

  // namesのaddressは大文字も含むため比較の場合は小文字に
  const { names } = useNamesByAddresses(wearers.map((w) => w.id));

  const members = useMemo(() => {
    const unresolvedMembers = wearers.filter(
      ({ id }) => !names.flat().find((n) => n.address.toLowerCase() === id)
    );

    return [
      ...names.flat().map((n) => ({
        ...n,
        wearer: wearers.find((w) => w.id === n.address.toLowerCase()),
      })),
      ...unresolvedMembers.map((m) => ({
        wearer: m,
        name: "",
        domain: "",
        text_records: {
          avatar: "",
        } as TextRecords,
      })),
    ];
  }, [wearers, names]);

  return (
    <>
      {/* Members */}
      <Heading>Members</Heading>
      <VStack width="full" alignItems="start" gap={3}>
        {members.map((m, i) => (
          <HStack key={i} width="full">
            <UserIcon
              userImageUrl={ipfs2https(m.text_records?.avatar)}
              size={10}
            />
            <VStack alignItems="start" width="full">
              <Text lineBreak="anywhere">
                {m.name
                  ? `${m.name} (${m.wearer?.id.slice(0, 6)}...${m.wearer?.id.slice(-4)})`
                  : m.wearer?.id}
              </Text>
              <HStack wrap="wrap" width="full" gap={2}>
                {m.wearer?.hats?.map((h) => (
                  <HatsListItemParser
                    key={h.id}
                    imageUri={h.imageUri}
                    detailUri={h.details}
                  >
                    <HorizontalRole />
                  </HatsListItemParser>
                ))}
              </HStack>
            </VStack>
          </HStack>
        ))}
      </VStack>

      {/* Contribution */}
      <Heading>Contribution</Heading>
      {/* 何らかの形でコントリビューションのランクを出したい */}
    </>
  );
};

export default WorkspaceMember;

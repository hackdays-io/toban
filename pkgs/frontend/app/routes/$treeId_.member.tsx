import { Box, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { Link, useParams } from "@remix-run/react";
import { useNamesByAddresses } from "hooks/useENS";
import { useTokenRecipients } from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import { FC, useMemo } from "react";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { UserIcon } from "~/components/icon/UserIcon";
import { RoleTag } from "~/components/roles/RoleTag";
import { StickyNav } from "~/components/StickyNav";

const WorkspaceMember: FC = () => {
  const { treeId } = useParams();
  const tree = useTreeInfo(Number(treeId));

  // 重複のないwearersを取得し、wearerの持っているhatの情報を付与
  const wearers = useMemo(() => {
    if (!tree || !tree.hats) return [];
    return tree.hats
      .filter((h) => h.levelAtLocalTree && h.levelAtLocalTree >= 2)
      .flatMap((h) => h.wearers)
      .filter((w) => !!w)
      .filter((w, i, self) => self.findIndex((s) => s.id === w.id) === i)
      .map((w) => ({
        id: w.id,
        hats: tree.hats!.filter(
          (h) =>
            h.levelAtLocalTree &&
            h.levelAtLocalTree >= 2 &&
            h.wearers?.some(({ id }) => id === w.id)
        ),
      }));
  }, [tree]);

  // wearersのidをメモ化
  const wearersIds = useMemo(() => wearers.map(({ id }) => id), [wearers]);
  // namestone
  const { names: wearersNames } = useNamesByAddresses(wearersIds);

  // Members
  const members = useMemo(
    () =>
      wearersNames.flat().map((n) => ({
        ...n,
        wearer: wearers.find((w) => w.id === n.address.toLowerCase()),
      })),
    [wearers, wearersNames]
  );

  // hatIdとwearerのペアを取得
  const params = useMemo(() => {
    if (!tree || !tree.hats) return [];
    return tree.hats
      .filter((h) => h.levelAtLocalTree && h.levelAtLocalTree >= 2)
      .flatMap(
        ({ id, wearers }) =>
          wearers?.map((w) => ({ hatId: id, wearer: w.id })) || []
      );
  }, [tree]);

  const recipients = useTokenRecipients(params);

  const assistants = useMemo(() => {
    if (!tree || !tree.hats) return [];
    return recipients.map(({ assistant, hatIds }) => ({
      id: assistant,
      hats: tree.hats!.filter(
        (h) =>
          h.levelAtLocalTree && h.levelAtLocalTree >= 2 && hatIds.includes(h.id)
      ),
    }));
  }, [tree, recipients]);

  // assistantsのidをメモ化
  const assistantsIds = useMemo(
    () => assistants.map(({ id }) => id),
    [assistants]
  );
  // namestone
  const { names: assistantsNames } = useNamesByAddresses(assistantsIds);

  // AssistantMembers
  const assistantMembers = useMemo(
    () =>
      assistantsNames.flat().map((n) => ({
        ...n,
        assistant: assistants.find(
          (a) => a.id.toLowerCase() === n.address.toLowerCase()
        ),
      })),
    [assistants, assistantsNames]
  );

  return (
    <>
      {/* Members */}
      <Box mb={4}>
        <Heading pb={4}>Role Members</Heading>
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
                    ? `${m.name} (${abbreviateAddress(m.address)})`
                    : abbreviateAddress(m.address)}
                </Text>
                <HStack wrap="wrap" width="full" gap={2}>
                  {m.wearer?.hats?.map((h) => (
                    <Link key={h.id} to={`/${treeId}/${h.id}/${m.address}`}>
                      <HatsListItemParser
                        imageUri={h.imageUri}
                        detailUri={h.details}
                      >
                        <RoleTag />
                      </HatsListItemParser>
                    </Link>
                  ))}
                </HStack>
              </VStack>
            </HStack>
          ))}
        </VStack>
      </Box>

      {/* AssistantMembers */}
      <Box my={4}>
        <Heading py={4}>All Contributors</Heading>
        <VStack width="full" alignItems="start" gap={3}>
          {assistantMembers.map((m, i) => (
            <HStack key={`assistant_${i}`} width="full">
              <UserIcon
                userImageUrl={ipfs2https(m.text_records?.avatar)}
                size={10}
              />
              <VStack alignItems="start" width="full">
                <Text lineBreak="anywhere">
                  {m.name
                    ? `${m.name} (${abbreviateAddress(m.address)})`
                    : abbreviateAddress(m.address)}
                </Text>
                <HStack wrap="wrap" width="full" gap={2}>
                  {m.assistant?.hats?.map((h) => (
                    <HatsListItemParser
                      key={h.id}
                      imageUri={h.imageUri}
                      detailUri={h.details}
                    >
                      <RoleTag bgColor="blue.200" />
                    </HatsListItemParser>
                  ))}
                </HStack>
              </VStack>
            </HStack>
          ))}
        </VStack>
      </Box>

      <StickyNav />
    </>
  );
};

export default WorkspaceMember;

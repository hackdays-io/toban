import { Box, Text, Flex, Button } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import { useNamesByAddresses } from "hooks/useENS";
import { useTreeInfo } from "hooks/useHats";
import type { FC } from "react";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import CommonButton from "~/components/common/CommonButton";
import { CommonInput } from "~/components/common/CommonInput";
import { CommonTextArea } from "~/components/common/CommonTextarea";
import { UserIcon } from "~/components/icon/UserIcon";
import { WorkspaceIcon } from "~/components/icon/WorkspaceIcon";
import { PageHeader } from "~/components/PageHeader";

const SettingsSection: FC<{ children: React.ReactNode; headingText: string }> = ({
  children,
  headingText,
}) => (
  <Box mt={2} mb={12}>
    <Text fontSize="md" fontWeight="medium" color="gray.600">
      {headingText}
    </Text>
    {children}
  </Box>
);

const SettingsSubSection: FC<{ children: React.ReactNode; headingText: string }> = ({
  children,
  headingText,
}) => (
  <Box mt={3} mb={5}>
    <Text mb={3} fontSize="sm" fontWeight="medium" color="gray.600">
      {headingText}
    </Text>
    {children}
  </Box>
);

const InputWithActionButton: FC<{
  children: React.ReactNode;
  buttonText: string;
  color?: string;
  backgroundColor?: string;
}> = ({
  children,
  buttonText,
  color = "gray.800",
  backgroundColor = "yellow.400",
}) => (
  <Flex gap={2.5} mb={3.5}>
    {children}
    <Box>
      <CommonButton
      color={color}
      backgroundColor={backgroundColor}
    >
        {buttonText}
      </CommonButton>
    </Box>
  </Flex>
);

const InputAddressWithButton: FC<{
  placeholder: string;
  inputAddress: string;
  setInputAddress: (address: string) => void;
  buttonText: string;
  color?: string;
  backgroundColor?: string;
}> = ({
  placeholder,
  inputAddress,
  setInputAddress,
  buttonText,
  color = "gray.800",
  backgroundColor = "yellow.400",
}) => (
  <InputWithActionButton buttonText={buttonText} color={color} backgroundColor={backgroundColor}>
    <CommonInput
      placeholder={placeholder}
      value={inputAddress}
      onChange={(e) => setInputAddress(e.target.value)}
    />
  </InputWithActionButton>
);

const RoleSubSection: FC<{
  addresses: string[];
  accounts: { name: string; address: string }[];
  headingText: string;
  inputAddress: string;
  setInputAddress: (address: string) => void;
}> = ({ addresses, accounts, headingText, inputAddress, setInputAddress }) => {
  const { names } = useNamesByAddresses(addresses);

  return (
    <SettingsSubSection headingText={headingText}>
      <Box mb={8}>
        {accounts.map((account) => {
          const name = names.find(
            (name) => name[0]?.address === account.address,
          )?.[0];
          return (
            <InputWithActionButton key={account.address} buttonText="削除" backgroundColor="red.300">
              <Flex width="100%" alignItems="center" gap={2}>
                <UserIcon
                  size="40px"
                  userImageUrl={ipfs2https(name?.text_records?.avatar)}
                />
                <Box flexGrow={1}>
                  <Text textStyle="sm">{name?.name}</Text>
                  <Text textStyle="sm">
                    {abbreviateAddress(name?.address || "")}
                  </Text>
                </Box>
              </Flex>
            </InputWithActionButton>
          );
        })}
        <InputAddressWithButton
          placeholder="ユーザー名 or ウォレットアドレス"
          inputAddress={inputAddress}
          setInputAddress={setInputAddress}
          buttonText="追加"
        />
      </Box>
    </SettingsSubSection>
  );
};

const WorkspaceSettings: FC = () => {
  const { treeId } = useParams();
  const treeInfo = useTreeInfo(Number(treeId));

  return (
    <Box width="100%" pb={10}>
      <PageHeader title="ワークスペース設定" />
      <SettingsSection headingText="ワークスペースの概要">
        <Flex mt={8} width="100%" gap={8} alignItems="center">
          <Box
            mb={4}
            minW="120px"
            maxW="200px"
            w="20%"
            aspectRatio={1}
            bg="gray.100"
            borderRadius="3xl"
          >
            <WorkspaceIcon
              workspaceImageUrl={ipfs2https(
                treeInfo?.hats?.find((hat) => hat.levelAtLocalTree === 0)
                  ?.imageUri,
              )}
            />
          </Box>
          <Box>
            <CommonButton>
              画像をアップロード
            </CommonButton>
          </Box>
        </Flex>
        <SettingsSubSection headingText="名前">
          <CommonInput
            placeholder={"Hackdays"}
            value={"Hackdays"}
            onChange={(e) => console.log(e.target.value)}
          />
        </SettingsSubSection>
        <SettingsSubSection headingText="説明">
          <CommonTextArea
            minHeight="80px"
            placeholder={"Hackdays"}
            value={"Hackdays　Hackdays　HackdaysHackdaysHackdaysHackdaysHackdaysHackdays"}
            onChange={(e) => console.log(e.target.value)}
          />
        </SettingsSubSection>
        <Button
          size="lg"
          w="100%"
          h="40px"
          maxHeight="64px"
          minHeight="48px"
          backgroundColor="yellow.400"
          color="gray.800"
          borderRadius="12px"
          onClick={() => {}}
        >
          保存
        </Button>
      </SettingsSection>
      <SettingsSection headingText="ワークスペースの権限">
        <RoleSubSection
          addresses={["0xEef377Bdf67A227a744e386231fB3f264C158CDF"]}
          accounts={[{ name: "test2-1", address: "0xEef377Bdf67A227a744e386231fB3f264C158CDF" }]}
          headingText="役割の新規作成"
          inputAddress=""
          setInputAddress={() => {}}
        />
        <RoleSubSection
          addresses={["0xEef377Bdf67A227a744e386231fB3f264C158CDF"]}
          accounts={[{ name: "test2-1", address: "0xEef377Bdf67A227a744e386231fB3f264C158CDF" }]}
          headingText="役割の割当・休止・剥奪"
          inputAddress=""
          setInputAddress={() => {}}
        />
        <SettingsSubSection headingText="オーナー（注意して変更してください）">
          <InputAddressWithButton
            placeholder="0x1234567890"
            inputAddress="0x1234567890"
            buttonText="変更"
            color="white"
            backgroundColor="orange.500"
            setInputAddress={() => {}}
          />
        </SettingsSubSection>
      </SettingsSection>
    </Box>
  );
};

export default WorkspaceSettings;

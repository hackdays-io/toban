import { Box, Float, Input, Text } from "@chakra-ui/react";
import { useWallets } from "@privy-io/react-auth";
import { useNavigate } from "@remix-run/react";
import { useAddressesByNames, useSetName } from "hooks/useENS";
import { useUploadImageFileToIpfs } from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import { TextRecords } from "namestone-sdk";
import { FC, useEffect, useMemo, useState } from "react";
import { BasicButton } from "~/components/BasicButton";
import { CommonInput } from "~/components/common/CommonInput";
import { UserIcon } from "~/components/icon/UserIcon";

const Login: FC = () => {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");

  const {
    uploadImageFileToIpfs,
    imageFile,
    setImageFile,
    isLoading: isIpfsLoading,
  } = useUploadImageFileToIpfs();

  const { wallet, smartWallet, isSmartWallet } = useActiveWallet();

  const { setName, isLoading: isSetNameLoading } = useSetName();

  const names = useMemo(() => {
    return userName ? [userName] : [];
  }, [userName]);
  const { addresses } = useAddressesByNames(names);

  const availableName = useMemo(() => {
    if (!userName) return false;

    return addresses?.[0]?.length === 0;
  }, [userName, addresses]);

  const handleSubmit = async () => {
    if (!smartWallet && !wallet) return;

    const params: {
      name: string;
      address: string;
      text_records: TextRecords;
    } = {
      name: userName,
      address: isSmartWallet ? smartWallet?.account?.address! : wallet?.address,
      text_records: {},
    };

    if (imageFile) {
      const res = await uploadImageFileToIpfs();
      params.text_records.avatar = res?.ipfsUri!;
    }

    await setName(params);

    navigate("/workspace");
  };

  return (
    <>
      <Box as="label" cursor="pointer" m="100px auto 40px">
        <Input
          type="file"
          accept="image/*"
          display="none"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && file.type.startsWith("image/")) {
              setImageFile(file);
            } else {
              alert("画像ファイルを選択してください");
            }
          }}
        />
        <UserIcon
          userImageUrl={imageFile ? URL.createObjectURL(imageFile) : undefined}
          size={200}
        />
      </Box>
      <Box width="100%">
        <CommonInput
          value={userName}
          placeholder="ユーザー名"
          onChange={(e) => setUserName(e.target.value)}
        />
        <Text textAlign="right" fontSize="sm" mt={1}>
          {availableName
            ? "この名前は利用可能です"
            : "この名前は利用できません"}
        </Text>
      </Box>
      <Float
        placement="bottom-center"
        mb="4vh"
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <BasicButton
          onClick={handleSubmit}
          loading={isIpfsLoading || isSetNameLoading}
          disabled={!availableName}
        >
          保存
        </BasicButton>
      </Float>
    </>
  );
};

export default Login;

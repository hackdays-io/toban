import { Box, Input } from "@chakra-ui/react";
import { useWallets } from "@privy-io/react-auth";
import { useNavigate } from "@remix-run/react";
import { FC, useEffect, useState } from "react";
import { BottomMainButton } from "~/components/BottomMainButton";
import { FloatBottom } from "~/components/FloatBottom";
import { FloatCenter } from "~/components/FloatCenter";
import { CommonInput } from "~/components/common/CommonInput";
import { UserIcon } from "~/components/icon/UserIcon";

const Login: FC = () => {
  const navigate = useNavigate();
  // const { connectOrCreateWallet, user, logout } = usePrivy();
  const { wallets } = useWallets();

  const [userName, setUserName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // ToDo: ユーザーのtoban.ethアカウントが見つかったかどうかを、NameStoneまたはENSで判定するロジックを実装する
  const tobanEnsFound = false;
  console.log("tobanEnsFound:", tobanEnsFound);

  useEffect(() => {
    if (wallets.length === 0) {
      navigate("/login");
    }
  }, [wallets.length, navigate]);

  const handleSignup = () => {
    // ToDo: ユーザー名をNameStoneに登録し、toban.ethのサブドメインにも登録し、画像をIPFSにアップロードする
    console.log("signup:", userName);
  };

  return (
    <>
      <FloatCenter>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="200px"
          height="200px"
          mx="auto"
        >
          <Box as="label" cursor="pointer" width="100%" height="100%">
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
              userImageUrl={
                imageFile ? URL.createObjectURL(imageFile) : undefined
              }
              size={200}
            />
          </Box>
        </Box>
        <Box mt="10vh" mb="10vh" width="100%">
          <CommonInput
            value={userName}
            placeholder="ユーザー名"
            onChange={(e) => setUserName(e.target.value)}
          />
        </Box>
      </FloatCenter>
      <FloatBottom>
        <BottomMainButton onClick={handleSignup}>Save</BottomMainButton>
      </FloatBottom>
    </>
  );
};

export default Login;

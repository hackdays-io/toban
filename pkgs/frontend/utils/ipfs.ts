import { PinataSDK } from "pinata-web3";

const getPinataConfig = () => {
  const pinataJwt = import.meta.env.VITE_PINATA_JWT;
  const pinataGateway = import.meta.env.VITE_PINATA_GATEWAY;

  if (!pinataJwt) {
    throw new Error("VITE_PINATA_JWT is not defined");
  }
  if (!pinataGateway) {
    throw new Error("VITE_PINATA_GATEWAY is not defined");
  }

  return { pinataJwt, pinataGateway };
};

let ipfsClient: PinataSDK | null = null;

export const createIpfsClient = () => {
  if (ipfsClient) return ipfsClient;

  const { pinataJwt, pinataGateway } = getPinataConfig();
  ipfsClient = new PinataSDK({
    pinataJwt,
    pinataGateway,
  });

  return ipfsClient;
};

export const ipfsUploadJson = async (object: object) => {
  try {
    const ipfsClient = createIpfsClient();
    const upload = await ipfsClient.upload.json(object);
    return upload;
  } catch (error) {
    console.error("Failed to upload JSON to IPFS:", error);
    throw error;
  }
};

export const ipfsUploadFile = async (file: File) => {
  try {
    const ipfsClient = createIpfsClient();
    const upload = await ipfsClient.upload.file(file);
    return upload;
  } catch (error) {
    console.error("Failed to upload file to IPFS:", error);
    throw error;
  }
};

export const ipfs2https = (ipfsUri: string) => {
  const { pinataGateway } = getPinataConfig();
  const cid = ipfsUri.replace("ipfs://", "");
  return `${pinataGateway}/ipfs/${cid}`;
};

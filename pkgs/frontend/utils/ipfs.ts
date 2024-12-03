import { PinataSDK } from "pinata-web3";

const validateEnvVariables = () => {
  if (!import.meta.env.VITE_PINATA_JWT) {
    throw new Error("VITE_PINATA_JWT is not defined");
  }
  if (!import.meta.env.VITE_PINATA_GATEWAY) {
    throw new Error("VITE_PINATA_GATEWAY is not defined");
  }
};

let ipfsClient: PinataSDK | null = null;

export const createIpfsClient = () => {
  if (ipfsClient) return ipfsClient;

  validateEnvVariables();
  ipfsClient = new PinataSDK({
    pinataJwt: import.meta.env.VITE_PINATA_JWT as string,
    pinataGateway: import.meta.env.VITE_PINATA_GATEWAY as string,
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

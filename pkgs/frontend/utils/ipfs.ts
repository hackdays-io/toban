import { PinataSDK } from "pinata";

const getPinataConfig = () => {
  const pinataJwt = import.meta.env.VITE_PINATA_JWT;
  const pinataGateway = import.meta.env.VITE_PINATA_GATEWAY;
  const pinataGatewayToken = import.meta.env.VITE_PINATA_GATEWAY_TOKEN;

  if (!pinataJwt) {
    throw new Error("VITE_PINATA_JWT is not defined");
  }
  if (!pinataGateway) {
    throw new Error("VITE_PINATA_GATEWAY is not defined");
  }
  if (!pinataGatewayToken) {
    throw new Error("VITE_PINATA_GATEWAY_TOKEN is not defined");
  }

  return { pinataJwt, pinataGateway, pinataGatewayToken };
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
    const upload = await ipfsClient.upload.public.json(object);
    return upload;
  } catch (error) {
    console.error("Failed to upload JSON to IPFS:", error);
    throw error;
  }
};

export const ipfsUploadFile = async (file: File) => {
  try {
    const ipfsClient = createIpfsClient();
    const upload = await ipfsClient.upload.public.file(file);
    return upload;
  } catch (error) {
    console.error("Failed to upload file to IPFS:", error);
    throw error;
  }
};

export const ipfsUploadImageFile = async (imageFile: File) => {
  if (!imageFile) throw new Error("Invalid or no image file selected");
  if (!imageFile?.type.startsWith("image/"))
    throw new Error("Invalid or no image file selected");

  return await ipfsUploadFile(imageFile);
};

export const ipfs2https = (ipfsUri?: string) => {
  if (!ipfsUri) return;
  const { pinataGateway, pinataGatewayToken } = getPinataConfig();
  const cid = ipfsUri.replace("ipfs://", "");
  return `https://${pinataGateway}/ipfs/${cid}?pinataGatewayToken=${pinataGatewayToken}`;
};

export const ipfs2httpsJson = async (ipfsUri?: string) => {
  if (!ipfsUri) return;
  const httpsUri = ipfs2https(ipfsUri);
  if (!httpsUri) return;
  const response = await fetch(httpsUri);
  if (!response.ok) return;
  return response.json();
};

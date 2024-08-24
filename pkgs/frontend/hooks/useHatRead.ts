import { createSubgraphClient } from "@/lib/hats"
import { useEffect } from "react"
import { useAccount, useChainId } from "wagmi"

const hatSubgraphClient = createSubgraphClient()

export const useGetTopHat = () => {
  const chainId = useChainId()
  const {address} = useAccount()

  useEffect(() => {
    const fetch = async () => {
      if (!chainId || !address) return
      const data = await hatSubgraphClient.getWearer({
        chainId,
        wearerAddress: address,
        props: {}
      })

      console.log(data)
    }
    fetch()
  }, [chainId, address])

  return
}
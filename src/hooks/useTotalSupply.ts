import { BigNumber } from '@ethersproject/bignumber'
import { Currency, CurrencyAmount, Token } from '@sushiswap/core-sdk'
import { useSingleCallResult } from 'app/state/multicall/hooks'

import { getTokenContractNonHook, useTokenContract } from './useContract'

export async function getTotalSupplyNonHook(token: Currency): Promise<CurrencyAmount<Token> | undefined> {
  const contract = getTokenContractNonHook(token?.isToken ? token.address : undefined, false)

  if (!contract) return undefined

  const totalSupply: BigNumber = await contract.totalSupply()

  return token?.isToken && totalSupply ? CurrencyAmount.fromRawAmount(token, totalSupply.toString()) : undefined
}

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export function useTotalSupply(token?: Currency): CurrencyAmount<Token> | undefined {
  const contract = useTokenContract(token?.isToken ? token.address : undefined, false)

  const totalSupply: BigNumber = useSingleCallResult(contract, 'totalSupply')?.result?.[0]

  return token?.isToken && totalSupply ? CurrencyAmount.fromRawAmount(token, totalSupply.toString()) : undefined
}

// NOTE: Try not to add anything to thie file, it's almost entirely refactored out.

import { AddressZero } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { ChainId, ROUTER_ADDRESS } from '@sushiswap/core-sdk'
import IUniswapV2Router02ABI from 'app/constants/abis/uniswap-v2-router-02.json'
import IUniswapV2Router02NoETHABI from 'app/constants/abis/uniswap-v2-router-02-no-eth.json'
import { isAddress } from 'app/functions/validate'
import store from 'app/state'

// account is not optional
export function getSigner(library: Web3Provider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

// account is optional
export function getProviderOrSigner(library: Web3Provider, account?: string): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library
}

// account is optional
export function _getContract(address: string, ABI: any, library: Web3Provider, account?: string): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return new Contract(address, ABI, getProviderOrSigner(library, account))
}

export function getContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
  const { account, library } = store.getState().web3Context
  if (!address || address === AddressZero || !ABI || !library) return null
  try {
    return _getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
  } catch (error) {
    console.error('Failed to get contract', error)
    return null
  }
}

export function getRouterAddress(chainId?: ChainId) {
  if (!chainId) {
    throw Error(`Undefined 'chainId' parameter '${chainId}'.`)
  }
  return ROUTER_ADDRESS[chainId]
}

const test = IUniswapV2Router02ABI

// account is optional
export function getRouterContract(chainId: number, library: Web3Provider, account?: string): Contract {
  return _getContract(
    getRouterAddress(chainId),
    chainId !== ChainId.CELO ? IUniswapV2Router02ABI : IUniswapV2Router02NoETHABI,
    library,
    account
  )
}

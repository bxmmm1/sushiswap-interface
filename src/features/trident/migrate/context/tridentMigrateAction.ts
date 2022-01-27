import { Contract } from '@ethersproject/contracts'
import { CurrencyAmount, Token } from '@sushiswap/core-sdk'
import ConstantProductPoolArtifact from '@sushiswap/trident/artifacts/contracts/pool/ConstantProductPool.sol/ConstantProductPool.json'
import { computeConstantProductPoolAddress, Fee } from '@sushiswap/trident-sdk'
import { v2Migration } from 'app/features/trident/migrate/context/migrateSlice'
import { getContract } from 'app/functions'
import { getConstantProductPoolFactory } from 'app/hooks'
import { getTotalSupplyNonHook } from 'app/hooks/useTotalSupply'

// Because twap setting is a boolean, a few more checks are necessary
export const getTwapSelection = (migration: v2Migration): boolean | undefined => {
  const tridentTwapSelection = migration.matchingTridentPool?.twapEnabled
  if (tridentTwapSelection !== undefined) return tridentTwapSelection
  return migration.poolToCreate?.twap
}

export const getSwapFee = (migration: v2Migration): Fee | undefined => {
  return migration.matchingTridentPool?.swapFee || migration.poolToCreate?.fee
}

export const tridentMigrateAction = async (
  contract: Contract,
  migration: v2Migration,
  lpTokenAmount: CurrencyAmount<Token>
): Promise<string> => {
  const swapFee = getSwapFee(migration)
  const twapEnabled = getTwapSelection(migration)

  if (swapFee === undefined || twapEnabled === undefined)
    throw new Error('Missing required swapFee or twapEnabled field')

  // burn LP simulation
  // Get token0 + token1 amounts
  // SDK? -- Remove
  // Pair getLiquidityAmount
  // getLiquidityValue - CORE-SDK
  const v2PoolSupply = await getTotalSupplyNonHook(migration.v2Pair.liquidityToken)
  const token0LiquidityVal = migration.v2Pair.getLiquidityValue(migration.v2Pair.token0, v2PoolSupply!, lpTokenAmount)
  const token1LiquidityVal = migration.v2Pair.getLiquidityValue(migration.v2Pair.token1, v2PoolSupply!, lpTokenAmount)

  // console.log('token0LiquidityVal', token0LiquidityVal.toExact())
  // console.log('token1LiquidityVal', token1LiquidityVal.toExact())

  // getLiquidityMinted - TRIDENT
  // mint LP simulations
  // how much liquidity LP I will get
  // in trident add liquidity

  const cppFactory = getConstantProductPoolFactory()
  const tridentPoolAddress = computeConstantProductPoolAddress({
    factoryAddress: cppFactory!.address,
    tokenA: migration.v2Pair.token0,
    tokenB: migration.v2Pair.token1,
    fee: swapFee,
    twap: twapEnabled,
  })

  const cppContract = getContract(cppFactory!.address, ConstantProductPoolArtifact.abi)
  // console.log('tridentPool', {
  //   factoryAddress: cppFactory!.address,
  //   tokenA: migration.v2Pair.token0,
  //   tokenB: migration.v2Pair.token1,
  //   fee: swapFee,
  //   twap: twapEnabled,
  // })

  // console.log('trident pool selelcted', migration.matchingTridentPool?.address)

  const reserves = await cppContract!.getReserves()

  // console.log('RESERVES', reserves)

  // const cppPool = new ConstantProductPool().getLiquidityMinted()

  return contract.interface.encodeFunctionData('migrate', [
    migration.v2Pair.liquidityToken.address,
    lpTokenAmount.quotient.toString(),
    swapFee,
    twapEnabled,

    // UI override somewhere
    // .5%
    '1', // TODO: Need to simulate
  ])
}

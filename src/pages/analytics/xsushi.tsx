import { ChainId, SUSHI_ADDRESS } from '@sushiswap/core-sdk'
import React, { useMemo } from 'react'
import { classNames, formatNumber, formatPercent } from '../../functions'
import { useBar, useBarHistory } from '../../services/graph/hooks/bar'
import { useBlock, useDayData, useFactory, useNativePrice, useTokenDayData, useTokens } from '../../services/graph'

import AnalyticsContainer from '../../features/analytics/AnalyticsContainer'
import Background from '../../features/analytics/Background'
import ColoredNumber from '../../features/analytics/ColoredNumber'
import InfoCard from '../../features/analytics/Bar/InfoCard'
import TimespanGraph from '../../components/TimespanGraph'
import { XSUSHI } from '../../config/tokens'
import { aprToApy } from '../../functions/convert/apyApr'

const chartTimespans = [
  {
    text: '1W',
    length: 604800,
  },
  {
    text: '1M',
    length: 2629746,
  },
  {
    text: '1Y',
    length: 31556952,
  },
  {
    text: 'ALL',
    length: Infinity,
  },
]

export default function XSushi() {
  const block1d = useBlock({ daysAgo: 1, chainId: ChainId.MAINNET })

  const exchange = useFactory({ chainId: ChainId.MAINNET })
  const exchange1d = useFactory({ block: block1d, chainId: ChainId.MAINNET })

  const dayData = useDayData({ chainId: ChainId.MAINNET })

  const ethPrice = useNativePrice({ chainId: ChainId.MAINNET })
  const ethPrice1d = useNativePrice({ block: block1d, chainId: ChainId.MAINNET, shouldFetch: !!block1d })

  const xSushi = useTokens({ chainId: ChainId.MAINNET, subset: [XSUSHI.address] })?.[0]
  const xSushi1d = useTokens({ block: block1d, chainId: ChainId.MAINNET, subset: [XSUSHI.address] })?.[0]
  const sushiDayData = useTokenDayData({ token: SUSHI_ADDRESS['1'], chainId: ChainId.MAINNET })

  const bar = useBar()
  const bar1d = useBar({ block: block1d, shouldFetch: !!block1d })
  const barHistory = useBarHistory()

  const [xSushiPrice, xSushiMarketcap] = [
    xSushi?.derivedETH * ethPrice,
    xSushi?.derivedETH * ethPrice * bar?.totalSupply,
  ]

  const [xSushiPrice1d, xSushiMarketcap1d] = [
    xSushi1d?.derivedETH * ethPrice1d,
    xSushi1d?.derivedETH * ethPrice1d * bar1d?.totalSupply,
  ]

  const data = useMemo(
    () =>
      barHistory && dayData && sushiDayData && bar
        ? barHistory.map((barDay) => {
            const exchangeDay = dayData.find((day) => day.date === barDay.date)
            const sushiDay = sushiDayData.find((day) => day.date === barDay.date)

            const totalSushiStakedUSD = barDay.xSushiSupply * barDay.ratio * sushiDay.priceUSD

            const APR =
              totalSushiStakedUSD !== 0 ? ((exchangeDay.volumeUSD * 0.0005 * 365) / totalSushiStakedUSD) * 100 : 0

            return {
              APR: APR,
              APY: aprToApy(APR, 365),
              xSushiSupply: barDay.xSushiSupply,
              date: barDay.date,
              feesReceived: exchangeDay.volumeUSD * 0.0005,
              sushiStaked: barDay.sushiStaked,
              sushiHarvested: barDay.sushiHarvested,
            }
          })
        : [],
    [barHistory, dayData, sushiDayData, bar]
  )

  const APY1d = aprToApy(
    (((exchange?.volumeUSD - exchange1d?.volumeUSD) * 0.0005 * 365.25) / (bar?.totalSupply * xSushiPrice)) * 100 ?? 0
  )
  const APY1w = aprToApy(data.slice(-7).reduce((acc, day) => (acc += day.APY), 0) / 7)

  const graphs = useMemo(
    () => [
      {
        title: 'xSushi Performance',
        labels: ['Daily APY', 'Daily APR'],
        data: [
          data.map((d) => ({
            date: d.date * 1000,
            value: d.APY,
          })),
          data.map((d) => ({
            date: d.date * 1000,
            value: d.APR,
          })),
        ],
      },
      {
        title: 'Daily Fees Received',
        labels: ['Fees (USD)'],
        data: [
          data.map((d) => ({
            date: d.date * 1000,
            value: d.feesReceived,
          })),
        ],
      },
      {
        title: 'xSushi Supply Movements',
        labels: ['Daily Minted', 'Daily Burned'],
        data: [
          data.map((d) => ({
            date: d.date * 1000,
            value: d.sushiStaked,
          })),
          data.map((d) => ({
            date: d.date * 1000,
            value: d.sushiHarvested,
          })),
        ],
      },
      {
        title: 'xSushi Total Supply',
        labels: ['Supply'],
        data: [
          data.map((d) => ({
            date: d.date * 1000,
            value: d.xSushiSupply,
          })),
        ],
      },
    ],
    [data]
  )

  return (
    <AnalyticsContainer>
      <Background background="bar">
        <div className="grid items-center justify-between grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
          <div className="space-y-5">
            <div className="text-3xl font-bold text-high-emphesis">xSushi</div>
            <div>Find out all about xSushi here.</div>
          </div>
          <div className="flex space-x-12">
            <div className="flex flex-col">
              <div>Price</div>
              <div className="flex items-center space-x-2">
                <div className="text-lg font-medium text-high-emphesis">{formatNumber(xSushiPrice ?? 0, true)}</div>
                <ColoredNumber number={(xSushiPrice / xSushiPrice1d) * 100 - 100} percent={true} />
              </div>
            </div>
            <div className="flex flex-col">
              <div>Market Cap</div>
              <div className="flex items-center space-x-2">
                <div className="text-lg font-medium text-high-emphesis">
                  {formatNumber(xSushiMarketcap ?? 0, true, false)}
                </div>
                <ColoredNumber number={(xSushiMarketcap / xSushiMarketcap1d) * 100 - 100} percent={true} />
              </div>
            </div>
          </div>
        </div>
      </Background>
      <div className="px-4 pt-4 space-y-5 lg:px-14">
        <div className="flex flex-row space-x-4 overflow-auto">
          <InfoCard text="APY (Last 24 Hours)" number={formatPercent(APY1d)} />
          <InfoCard text="APY (Last 7 Days)" number={formatPercent(APY1w)} />
          <InfoCard text="xSUSHI Supply" number={formatNumber(bar?.totalSupply)} />
          <InfoCard text="xSUSHI : SUSHI" number={Number(bar?.ratio ?? 0)?.toFixed(4)} />
        </div>
        <div className="space-y-4">
          {graphs.map((graph, i) => (
            <div
              className={classNames(
                graph.data[0].length === 0 && 'hidden',
                'p-1 rounded bg-dark-900 border border-dark-700'
              )}
              key={i}
            >
              <div className="w-full h-96">
                <TimespanGraph
                  labels={graph.labels}
                  title={graph.title}
                  timespans={chartTimespans}
                  defaultTimespan="1M"
                  data={graph.data}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsContainer>
  )
}
import { Switch } from '@headlessui/react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Currency, CurrencyAmount } from '@sushiswap/core-sdk'
import ExternalLink from 'app/components/ExternalLink'
import Pagination from 'app/components/Pagination'
import Typography from 'app/components/Typography'
import { Auction } from 'app/features/miso/context/Auction'
import useAuctionCommitments from 'app/features/miso/context/hooks/useAuctionCommitments'
import { AuctionCommitment } from 'app/features/miso/context/types'
import { classNames, getExplorerLink, shortenAddress, shortenString } from 'app/functions'
import { useActiveWeb3React } from 'app/services/web3'
import React, { FC, useMemo, useState } from 'react'
import { useFlexLayout, usePagination, useSortBy, useTable } from 'react-table'

export const useCommitmentTableConfig = (commitments?: AuctionCommitment[]) => {
  const { chainId } = useActiveWeb3React()

  const AssetColumns = useMemo(
    () =>
      chainId
        ? [
            {
              Header: 'Address',
              accessor: 'address',
              className: 'text-left',
              Cell: (props: { value: string }) => {
                return (
                  <ExternalLink href={getExplorerLink(chainId, props.value, 'address')}>
                    {shortenAddress(props.value)}
                  </ExternalLink>
                )
              },
            },
            {
              Header: 'Committed',
              accessor: 'amount',
              className: 'text-right justify-end',
              Cell: (props: { value: CurrencyAmount<Currency> }) => {
                return (
                  <span className="flex gap-1">
                    {props.value.toSignificant(6)}
                    <span className="text-secondary">{props.value.currency.symbol}</span>
                  </span>
                )
              },
            },
            {
              Header: 'Block',
              accessor: 'blockNumber',
              className: 'text-right justify-end hidden md:block',
            },
            {
              Header: 'Transaction',
              accessor: 'txHash',
              className: 'text-right justify-end hidden lg:block',
              Cell: (props: { value: string }) => {
                return (
                  <ExternalLink href={getExplorerLink(chainId, props.value, 'transaction')}>
                    {shortenString(props.value, 12)}
                  </ExternalLink>
                )
              },
            },
          ]
        : [],
    [chainId]
  )

  const defaultColumn = React.useMemo(() => ({ minWidth: 0 }), [])

  return useMemo(
    () => ({
      config: {
        columns: AssetColumns,
        data: commitments || [],
        defaultColumn,
        initialState: {
          pageSize: 10,
          sortBy: [{ id: 'blockNumber', desc: true }],
        },
        autoResetFilters: false,
      },
    }),
    [AssetColumns, commitments, defaultColumn]
  )
}

interface AuctionBidsTabProps {
  auction: Auction
  active: boolean
}

const AuctionBidsTab: FC<AuctionBidsTabProps> = ({ auction, active }) => {
  const { account } = useActiveWeb3React()
  const commitments = useAuctionCommitments(auction)
  const [ownBidsOnly, setOwnBidsOnly] = useState(false)
  const data = useMemo(() => {
    if (ownBidsOnly) {
      return commitments.filter((el) => el.address.toLowerCase() === account?.toLowerCase())
    }
    return commitments
  }, [account, commitments, ownBidsOnly])
  const { config } = useCommitmentTableConfig(data)
  const { i18n } = useLingui()

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    gotoPage,
    canPreviousPage,
    canNextPage,
    prepareRow,
    state: { pageIndex, pageSize },
  } = useTable(config, useSortBy, usePagination, useFlexLayout)

  return (
    <div className={classNames(active ? 'block' : 'hidden', 'flex flex-col gap-8')}>
      <div className="flex justify-between">
        <div className="flex flex-col">
          <Typography variant="lg" className="text-high-emphesis">
            {i18n._(t`Participants`)}
          </Typography>
          <Typography variant="lg" weight={700} className="text-white">
            {[...new Set(commitments.map((el) => el.address))].length}
          </Typography>
        </div>
        <Switch.Group>
          <div className="flex items-center">
            <Switch.Label className="mr-2 cursor-pointer">
              <Typography className={ownBidsOnly ? 'text-primary' : 'text-secondary'}>
                {i18n._(t`Show my bids only`)}
              </Typography>
            </Switch.Label>
            <Switch
              checked={ownBidsOnly}
              onChange={setOwnBidsOnly}
              className="bg-gray-600 relative inline-flex items-center h-3 rounded-full w-9 transition-colors"
            >
              <span
                className={`${
                  ownBidsOnly ? 'translate-x-5' : ''
                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
              />
            </Switch>
          </div>
        </Switch.Group>
      </div>
      <div {...getTableProps()} className="w-full">
        <div className="mb-3">
          {headerGroups.map((headerGroup, i) => (
            <div {...headerGroup.getHeaderGroupProps()} key={i}>
              {headerGroup.headers.map((column, i) => (
                <Typography
                  weight={700}
                  key={i}
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  className={classNames(column.className)}
                >
                  {column.render('Header')}
                </Typography>
              ))}
            </div>
          ))}
        </div>
        <div {...getTableBodyProps()}>
          {page.length > 0 ? (
            page.map((row, i) => {
              prepareRow(row)
              return (
                <div {...row.getRowProps()} key={i} className="space-y-4">
                  {row.cells.map((cell, i) => {
                    return (
                      <Typography
                        weight={400}
                        key={i}
                        {...cell.getCellProps()}
                        className={classNames(
                          'flex items-center text-high-emphesis',
                          headerGroups[0].headers[i].className
                        )}
                      >
                        {cell.render('Cell')}
                      </Typography>
                    )
                  })}
                </div>
              )
            })
          ) : (
            <Typography
              variant="xs"
              className="text-center text-low-emphesis h-[60px] flex items-center justify-center"
            >
              {i18n._(t`No commitments`)}
            </Typography>
          )}
        </div>
      </div>
      <Pagination
        canPreviousPage={canPreviousPage}
        canNextPage={canNextPage}
        onChange={gotoPage}
        totalPages={Math.ceil(data.length / pageSize)}
        currentPage={pageIndex}
        pageNeighbours={1}
      />
    </div>
  )
}

export default AuctionBidsTab
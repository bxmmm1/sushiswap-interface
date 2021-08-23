import React, { FC, useCallback } from 'react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import FixedRatioExplanationModal from './FixedRatioExplanationModal'
import { PoolContextType, PoolStateType } from '../types'
import { setFixedRatioMode } from '../context/actions'
import Typography from '../../../components/Typography'
import { useTridentAddContext, useTridentAddState } from '../context'

interface FixedRatioHeaderProps {
  margin?: boolean
}

const FixedRatioHeader: FC<FixedRatioHeaderProps> = <S extends PoolStateType, C extends PoolContextType>({
  margin = true,
}) => {
  const { i18n } = useLingui()
  const { fixedRatio } = useTridentAddState<S>()
  const { dispatch } = useTridentAddContext<C>()

  const disableFixedRatio = useCallback(() => {
    setFixedRatioMode(dispatch)(!fixedRatio)
  }, [dispatch, fixedRatio])

  return (
    <div className={margin ? '-top-6 pt-10 pb-5 relative z-0' : 'py-5 relative z-0'}>
      <div className="top-0 pointer-events-none absolute w-full h-full bg-gradient-to-r from-opaque-blue to-opaque-pink opacity-40" />
      <div className="flex justify-between px-5">
        <div className="flex flex-row gap-1">
          <Typography variant="sm">{i18n._(t`1:1 Ratio: `)}</Typography>
          <Typography variant="sm" weight={700} className="text-blue">
            {fixedRatio ? i18n._(t`On`) : i18n._(t`Off`)}
          </Typography>
          <FixedRatioExplanationModal />
        </div>

        <Typography role="button" variant="sm" className="text-blue cursor-pointer" onClick={disableFixedRatio}>
          {fixedRatio ? i18n._(t`Turn off`) : i18n._(t`Turn on`)}
        </Typography>
      </div>
    </div>
  )
}

export default FixedRatioHeader

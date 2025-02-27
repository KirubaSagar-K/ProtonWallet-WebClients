import type { ReactNode } from 'react';
import { useContext } from 'react';

import { useBitcoinNetwork, useDecryptedApiWalletsData } from '@proton/wallet';

import { BitcoinBlockchainContext } from '.';
import { useBitcoinAddressPool } from '../../hooks/useBitcoinAddressPool';
import { useDebounceEffect } from '../../utils/hooks/useDebouncedEffect';
import { useBlockchainFeesEstimation } from './useBlockchainFeesEstimation';
import { useWalletsChainData } from './useWalletsChainData';

interface Props {
    children: ReactNode;
}

export const BitcoinBlockchainContextProvider = ({ children }: Props) => {
    const [network] = useBitcoinNetwork();
    const {
        decryptedApiWalletsData,
        walletMap,
        loading: loadingApiWalletsData,
        setPassphrase,
    } = useDecryptedApiWalletsData();

    const {
        walletsChainData,
        accountIDByDerivationPathByWalletID,
        syncingMetatadaByAccountId,
        syncManyWallets,
        syncSingleWallet,
        syncSingleWalletAccount,
        incrementSyncKey,
        isSyncing,
        getSyncingData,
    } = useWalletsChainData(decryptedApiWalletsData);

    const { feesEstimation, loading: loadingFeesEstimation } = useBlockchainFeesEstimation();

    const { fillBitcoinAddressPools, fillBitcoinAddressPoolForAccount } = useBitcoinAddressPool({
        decryptedApiWalletsData,
        walletsChainData,
    });

    useDebounceEffect(
        () => {
            void fillBitcoinAddressPools();
        },
        [],
        3000
    );

    return (
        <BitcoinBlockchainContext.Provider
            value={{
                network,

                decryptedApiWalletsData,
                walletMap,
                loadingApiWalletsData,
                setPassphrase,

                walletsChainData,
                accountIDByDerivationPathByWalletID,
                syncingMetatadaByAccountId,
                syncManyWallets,
                syncSingleWallet,
                syncSingleWalletAccount,
                incrementSyncKey,

                isSyncing,
                getSyncingData,

                feesEstimation,
                loadingFeesEstimation,

                fillBitcoinAddressPools,
                fillBitcoinAddressPoolForAccount,
            }}
        >
            {children}
        </BitcoinBlockchainContext.Provider>
    );
};

export const useBitcoinBlockchainContext = () => useContext(BitcoinBlockchainContext);
